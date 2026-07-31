# Plan: Update warm-up-cache routes

Issue: [923-update-warm-up-cache-routes.md](../issues/923-update-warm-up-cache-routes.md)

## Overview

Two things happen here: (1) `.circleci/navi_config.yaml` gets the five missing
`game_document_*` resources so the cache warmer actually crawls game-level document
details/files/photos, and (2) ownership of the Navi cache-warmer configuration moves
off the `infra` agent onto a brand-new `cache` specialist agent, which also gains a
read-only responsibility to flag restricted endpoints missing the `X-Skip-Cache`
header. This is primarily cross-cutting/documentation work (new agent file + updates
to `infra`/`architect` agent docs), with one focused CI-config edit alongside it.

All three backend routes needed (`game-document-detail`, `game-document-files`,
`game-document-photos`) already exist — confirmed in
`backend/games/urls/games.py` / `backend/games/views/games/` — so no backend changes
are required.

## Context

- `.circleci/navi_config.yaml` is Navi's route config (see
  `docs/agents/external/HOW_TO_USE_NAVI.md` and `docs/agents/cache-warmer.md`). It
  currently chains `/games.json` → game detail → pcs/npcs/treasures/items/sessions →
  their nested resources, but has no entry point into a game's own documents beyond
  the plain listing (`game_documents`/`paginated_game_documents`, no `actions`).
- `GameDocumentDetailSerializer` (`backend/games/serializers/games/documents/game_document_list.py`)
  exposes `id`, `name`, `photo_path`, `description` — **no `game_slug`**, unlike
  PC/NPC detail serializers. So the new chain must carry `slug` forward via Navi's
  inherited `parameters.slug` (the same trick already used by
  `paginated_pc_items`/`paginated_npc_items` → `pc_item_detail`/`npc_item_detail` for
  exactly this reason), not `parsedBody.game_slug`.
- `docs/agents/access-control/game-document.md` confirms `/games/<slug>/documents/<id>.json`,
  `.../files.json`, and `.../photos.json` are all **AllowAny** (regular, public) —
  their restricted counterparts live at different URLs (`full.json`,
  `files/all.json`, `photos/all.json` — never plain `.json`), so none of the five
  new resources need any restricted-endpoint exclusion logic; they're a clean case
  of "regular endpoint, no restricted twin at the same URL".
- The shortlist `per_page=17` in the issue matches
  `MAX_PREVIEW_DOCUMENT_FILES`/`MAX_PREVIEW_DOCUMENT_PHOTOS` in
  `frontend/assets/js/components/common/cards/characterPreviewConstants.js` — already
  the frontend's real preview size for these two resources, not an arbitrary number.
- `infra` is the only existing specialist agent with real work here (it currently
  owns `.circleci/navi_config.yaml` and documents Navi in its own agent file). No
  other specialist (`backend`, `frontend`, `proxy`, `translator`, `security`,
  `data-access`, `product-owner`) has any work on this issue. The bulk of the change
  — creating the new `cache` agent and updating cross-agent coordination docs — is
  cross-cutting and falls to the architect, since the `cache` agent doesn't exist
  yet to do its own bootstrapping.

## Implementation Steps

### Step 1 — Add the missing resources to `.circleci/navi_config.yaml`

Wire the new chain off the existing `paginated_game_documents` resource (it has no
`actions` today — add one), then add the four resources it triggers:

```yaml
  paginated_game_documents:
    - url: /games/{:slug}/documents.json?page={:page}
      status: 200
      actions:
        - resource: game_document_details
          parameters:
            slug: parameters.slug
            id: parsedBody.id

  game_document_details:
    - url: /games/{:slug}/documents/{:id}.json
      status: 200
      actions:
        - resource: game_document_files
          parameters:
            slug: parameters.slug
            id: parameters.id
        - resource: game_document_photos
          parameters:
            slug: parameters.slug
            id: parameters.id
        - resource: short_game_document_files
          parameters:
            slug: parameters.slug
            id: parameters.id
        - resource: short_game_document_photos
          parameters:
            slug: parameters.slug
            id: parameters.id

  game_document_files:
    - url: /games/{:slug}/documents/{:id}/files.json
      status: 200

  game_document_photos:
    - url: /games/{:slug}/documents/{:id}/photos.json
      status: 200

  short_game_document_files:
    - url: /games/{:slug}/documents/{:id}/files.json?per_page=17
      status: 200

  short_game_document_photos:
    - url: /games/{:slug}/documents/{:id}/photos.json?per_page=17
      status: 200
```

Note `slug`/`id` use the inherited `parameters.*` namespace at every level below
`game_document_details` (not `parsedBody.game_slug`), because the detail response
doesn't carry `game_slug` — see Context above.

Do **not** touch `paginated_game_treasures`/`paginated_game_items`/etc. or attempt to
fix any other paginated resource's chaining — out of scope per the issue (a separate,
pre-existing pagination bug covers that).

### Step 2 — Create the `cache` specialist agent

Add `.claude/agents/cache.md`, modeled on `infra.md` (edit rights over its owned
config) crossed with `security.md`/`data-access.md`'s read-only review pattern
(since this agent does both: it owns and edits one YAML file, but only *reports* on
a concern — `X-Skip-Cache` — that lives in code it doesn't touch):

```yaml
---
name: cache
description: Majora cache-warmer specialist. Owns `.circleci/navi_config.yaml` and
  keeps it in sync with the API surface (new regular/paginated/nested/short_*
  endpoints). Also reviews, read-only, that restricted endpoints set the
  `X-Skip-Cache` header — reports violations rather than fixing them.
tools: Read, Edit, Write, Bash
---
```

Body sections to include:

- **Your scope**: `.circleci/navi_config.yaml` and `docs/agents/cache-warmer.md`.
  Do NOT touch `backend/`, `frontend/`, or `proxy/`.
- **Maintaining `.circleci/navi_config.yaml`**: the same rules from the issue —
  include regular/paginated/nested/`short_*` resources; find `short_*` per-page
  values from the relevant `MAX_PREVIEW_*` frontend constant rather than guessing;
  never include mutation endpoints; never include restricted endpoints unless the
  same URL is also the regular form (e.g. `/games.json`) — cross-check
  `docs/agents/access-control/` to tell regular from restricted.
- **X-Skip-Cache review**: read-only (mirror `security.md`'s "Your purpose"
  wording — never edits files, only reports), invoked by the architect after
  `backend`/`proxy` touches a restricted endpoint, checking the response actually
  sets `X-Skip-Cache` (backend: response header, see
  `backend/accounts/tests/auth/account_test.py` for the existing pattern; proxy:
  `skip_cache_header` rule, see `docs/agents/security-guidelines/proxy-rules.md`
  and `.claude/agents/proxy.md`'s "Cache bypass" section). Same CLEAN/FINDINGS
  report format as `security.md`.

### Step 3 — Remove Navi ownership from the `infra` agent

Edit `.claude/agents/infra.md`:
- Drop `.circleci/navi_config.yaml — Navi cache warmer configuration` from the
  "Your scope" bullet list, and drop "Navi cache warmer" from the one-line
  `description` in the frontmatter.
- Delete the whole "## Navi cache warmer" section (current lines ~69-89).
- Add a short delegation note, mirroring the existing PHP-proxy delegation note:
  `.circleci/navi_config.yaml` (and the Navi cache-warmer docs) are owned by the
  `cache` agent — delegate any task involving cache warm-up routes to it.

### Step 4 — Update the architect's coordination docs

Edit `.claude/agents/architect.md`:
- Add a `cache` row to the "Specialist agents" table:
  `.circleci/navi_config.yaml`, cache-warmer docs — Navi warm-up route maintenance
  + `X-Skip-Cache` review.
- Replace the two "infra — add new endpoints to `.circleci/navi_config.yaml`..."
  lines under "Typical cross-cutting flows" with `cache`.
- Add a "Cache warm-up review" subsection, mirroring "Security review"/"Data access
  control review": invoke `cache` after `backend`/`frontend`/`proxy` whenever an
  issue adds/changes an API endpoint (keep the warm-up config in sync) or touches a
  restricted endpoint (verify `X-Skip-Cache`); if it reports a missing header,
  delegate the fix to `backend`/`proxy` and re-invoke `cache` to confirm.
- Update the `cache-warmer.md` row in the "Documentation" table to note it's used
  by the `cache` agent (same phrasing style as `AGENTS.md`'s
  `security-guidelines.md` row).

### Step 5 — Update `docs/agents/cache-warmer.md` and `AGENTS.md`

- `docs/agents/cache-warmer.md`: add a short "Maintaining this configuration"
  section stating it's owned by the `cache` agent (link
  `.claude/agents/cache.md`) and summarizing the inclusion/exclusion rules from
  Step 2, so the doc is self-sufficient as the agent's primary reference (same
  role `security-guidelines.md` plays for `security`). Also mention the new
  document chain in the existing "Configuration" paragraph (currently only
  mentions games → pcs/npcs).
- `AGENTS.md`: append "; used by the `cache` agent" to the "Cache Warmer" doc-table
  row, matching the existing "Security Guidelines" row's phrasing.

## Files to Change

- `.circleci/navi_config.yaml` — add `game_document_details`, `game_document_files`,
  `game_document_photos`, `short_game_document_files`, `short_game_document_photos`,
  and wire `paginated_game_documents` to trigger the chain.
- `.claude/agents/cache.md` — new specialist agent.
- `.claude/agents/infra.md` — remove Navi ownership, add delegation note.
- `.claude/agents/architect.md` — add `cache` to the specialist table, add "Cache
  warm-up review" section, fix cross-cutting-flow mentions, update doc table row.
- `docs/agents/cache-warmer.md` — attribute ownership, document the maintenance
  rules, mention the new document chain.
- `AGENTS.md` — update the "Cache Warmer" doc-table row.

## Notes

- No backend or frontend changes are needed — all three routes and the `per_page=17`
  convention already exist.
- There is no CI job that lints `.circleci/navi_config.yaml` or `.claude/agents/*.md`
  on regular pushes (`warm-up-cache` only runs on release tags), so there's nothing
  to add under CI Checks — verification here is a careful read of the YAML plus
  cross-checking against `docs/agents/access-control/game-document.md`.
- Adding new paginated resources or fixing existing pagination chains elsewhere
  (e.g. `game_treasures`, `game_items`) stays out of scope per the issue.
