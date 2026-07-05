# Translator Plan: Add new NPC button and page

Main plan: [plan.md](plan.md)

## Shared contracts

`frontend` will reference these new keys (must exist, with matching structure, in both
`frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`):

- `game_npcs_page.new_npc` — "New NPC" button label
- `game_npc_new_page.title` — page heading
- `game_npc_new_page.name_label`
- `game_npc_new_page.role_label`
- `game_npc_new_page.description_label`
- `game_npc_new_page.private_description_label`
- `game_npc_new_page.hidden_label`
- `game_npc_new_page.money_label`
- `game_npc_new_page.submit` — submit button label
- `game_npc_new_page.error` — generic submission error message

## Implementation Steps

### Step 1 — Add `game_npcs_page` namespace

Add a new `game_npcs_page:` block to both `en.yaml` and `pt.yaml` (there is currently no such
namespace — the NPC index page's title is hardcoded in `GameNpcs.jsx`). Follow the sibling
`game_sessions_page` block's shape (`loading`, `title`, `new_session`) as the template, but
only `new_npc` is strictly required by `frontend`'s plan; add `title`/`loading` too for
consistency with `game_sessions_page` and in case `frontend` decides to use them (see
`frontend.md` Step 2's optional title-translation note).

English (`en.yaml`), inserted near the other `game_*_page` blocks (e.g. after
`game_sessions_page`/`game_session_new_page`):

```yaml
game_npcs_page:
  loading: Loading...
  title: Non-Player Characters
  new_npc: New NPC
```

Portuguese (`pt.yaml`), same keys, translated:

```yaml
game_npcs_page:
  loading: Carregando...
  title: Não-Jogadores
  new_npc: Novo NPC
```

(Match whatever tone/terminology `pt.yaml` already uses for "Non-Player Characters" and
"Loading..." elsewhere in the file — check existing `game_page`/`game_characters_page`
Portuguese entries for the established terms before finalizing wording.)

### Step 2 — Add `game_npc_new_page` namespace

Mirror `game_session_new_page` (title/labels/submit/error) plus the NPC-specific fields
already named in `npc_edit_page` (`role_label`, `description_label`,
`private_description_label`, `money_label`), and add a new `hidden_label`.

English (`en.yaml`):

```yaml
game_npc_new_page:
  title: New NPC
  name_label: Name
  role_label: Role
  description_label: Description
  private_description_label: DM Notes
  hidden_label: Hidden
  money_label: Money (copper pieces)
  submit: Create NPC
  error: Failed to create NPC. Please try again.
```

Portuguese (`pt.yaml`), same keys, translated to match the existing terminology used in
`npc_edit_page`/`game_session_new_page`'s Portuguese entries (e.g. reuse however
`private_description_label`/`money_label` are already phrased there for consistency).

### Step 3 — Verify key parity

Run the project's translation key-parity check (per this repo's `translator` agent scope,
the script that verifies translation keys stay in sync across `frontend/assets/i18n/*.yaml`)
to confirm `en.yaml` and `pt.yaml` have identical key sets after the additions.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `game_npcs_page` and `game_npc_new_page` blocks
- `frontend/assets/i18n/pt.yaml` — add matching, translated blocks

## Notes

- Do not invent wording independently from established terms already used for "NPC",
  "Hidden", "DM Notes", etc. elsewhere in `pt.yaml` — reuse them for consistency.
- `frontend` depends on these keys existing before its Jasmine specs/page can render
  correctly; coordinate ordering if run in parallel (translator's YAML change has no code
  dependency on frontend, so it can run first or in parallel without conflict).
