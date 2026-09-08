# crawler Plan: Crawler — Navi configuration to extract and import Lootstudios models

Main plan: [plan.md](plan.md)

## Shared contracts

Consumed from #1262 (merged) and #1281 (**blocking — not yet merged**):

- `POST /miniatures/collections/import.json` (#1281): `{ name, external_id?,
  url?, source_name }`. Upsert by `external_id` first, then `name`.
- `POST /miniatures/stl_models/import.json` (#1262, already merged): `{ name,
  external_id?, url?, source_name, collection_name?, collection_external_id?,
  tags? }`. Upsert by `external_id` first, then `url`. This plan sends only
  `name`, `external_id`, `source_name`, `collection_external_id` — no
  `collection_name`/`url`/`links` (see issue's "Why a second endpoint").
- Both endpoints: `Authorization: Token $MAJORA_API_TOKEN`, staff/admin only.

Lootstudios source shape (`docs/agents/specs/loot-crawling/`
`source-to-collections.md` / `collection-to-stl-models.md`):
`GET /wp-admin/admin-ajax.php?action=GetMyLootsCache` → `{ bundleObjs: [...] }`,
flat array distinguished by `obj_type` (`bundle` | `miniature`). Bundle
fields used: `obj_inid`, `obj_title`, `obj_slug`. Miniature fields used:
`obj_inid`, `obj_title`, `bnd_inid`.

## Steps

- [01 — Add the Navi config (clients + two-pass resource)](crawler/01-add-navi-config.md)
- [02 — Wire credentials and bot-protection headers](crawler/02-wire-credentials-and-headers.md)
- [03 — Fill in RUNNING.md's TBD placeholders](crawler/03-update-running-doc.md)

## Notes

- **Step 01/02 cannot be verified end-to-end (bundle side) until #1281
  merges** — `collections/import.json` doesn't exist yet. The config can
  still be written and reviewed against #1281's documented contract; a real
  run needs #1281 live.
- Pagination is explicitly out of scope for this plan (see #1282 — open
  question, unverified). If #1282 later finds `GetMyLootsCache` paginates,
  that's a follow-up to this issue, not part of it.
- No CI wiring: `crawler/` has no CI job today and this issue explicitly
  keeps it that way (manually-invoked, local-only tool — Lootstudios' catalog
  endpoint is gated behind a personal session, not a service credential).
