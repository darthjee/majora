# Translator Plan: Scoped API tokens: frontend token management page

Main plan: [plan.md](plan.md)

## Shared contracts

Write every key listed under *i18n keys* in [plan.md](plan.md#i18n-keys-translator-writes-them-frontend-reads-them),
in both `en` and `pt`, with identical key sets. The copy follows
[`token-ui.md`](../../specs/client/token-ui.md#warnings-and-copy):

- The page intro covers automations and the `client/` package. It says a token never does more
  than its owner can, cannot manage tokens or the account, and is revoked automatically if the
  account is suspended.
- The revoke text says automations stop immediately and that this cannot be undone.
- `games_empty_note`: "No games selected: this token can be used on all {{count}} games you can
  reach today, and on any game you join later." Use whatever interpolation syntax the existing
  YAML uses.
- `games_superuser_warning` says the token can act on every game in Majora, now and in future,
  and suggests selecting specific games.
- `game_not_reachable` says a selected game is no longer available, and to reload and pick again.
- `expires_in_past` mentions checking the device clock.
- `invalid_scope`, `duplicate_scope`, `duplicate_game` and `not_editable` get short, generic
  "reload the page" messages.
- `games_limit` says that at most {{max}} games can be selected.
- Each `family_<family>_help` line describes what the family covers. For example, NPCs include
  everything nested under them, photos included. `scopes_note` says some restricted reads need
  the `read` scope of several families.

## Implementation Steps

### Step 1 — Shared keys in `common.yaml`

Add `header.nav_api_tokens` ("API tokens") next to `nav_authorization_requests`. Add the new
error codes to the `errors:` block. Before adding `errors.max_length`, check whether it already
exists and reuse it if so. Do both languages.

### Step 2 — New `api_tokens_page.yaml`

Create `frontend/assets/i18n/en/api_tokens_page.yaml` and `frontend/assets/i18n/pt/api_tokens_page.yaml`
with the top-level key `api_tokens_page:` and every page key from the contract. Namespaces are
lazy-loaded by the `Proxy` in `index.js`, and `specs/support/preloadTranslations.js` reads every
`*.yaml`, so no `index.js` change is needed.

## Files to Change

- `frontend/assets/i18n/en/common.yaml`, `frontend/assets/i18n/pt/common.yaml`: the header label
  and the error codes.
- `frontend/assets/i18n/en/api_tokens_page.yaml`, `frontend/assets/i18n/pt/api_tokens_page.yaml`
  (new).

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`).

## Notes

- If the frontend agent adds or renames keys while implementing, sync both languages again and
  re-run `check_i18n`.
