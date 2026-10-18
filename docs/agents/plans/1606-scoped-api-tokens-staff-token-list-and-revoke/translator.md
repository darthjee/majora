# Translator Plan: Scoped API tokens: staff token list and revoke

Main plan: [plan.md](plan.md)

## Shared contracts

Add these keys under `staff_user_page:` in every language, keeping `en`/`pt` in sync:

| Key | English copy |
|---|---|
| `api_tokens_title` | `API tokens` |
| `api_tokens_loading` | `Loading API tokens...` |
| `api_tokens_error` | `Could not load this user's API tokens.` |
| `api_tokens_empty` | `This user has no API tokens.` |
| `api_tokens_action_error` | `Could not revoke the API token. Please try again.` |
| `api_tokens_actions_column` | `Actions` |

The column headers, the Revoke button, the revoke confirmation and the "token no longer exists" notice reuse existing `api_tokens_page.*` keys; do not duplicate them.

## Implementation Steps

### Step 1 — Add the staff panel keys

Add the six keys above to `frontend/assets/i18n/en/staff_user_page.yaml` and their Portuguese translations to `frontend/assets/i18n/pt/staff_user_page.yaml`, placed after the existing `recovery_token*` keys. Match the wording style of the existing recovery-token keys and of `api_tokens_page.yaml`.

## Files to Change

- `frontend/assets/i18n/en/staff_user_page.yaml` — new `api_tokens_*` keys.
- `frontend/assets/i18n/pt/staff_user_page.yaml` — the same keys in Portuguese.

## CI Checks

- `frontend`: the translation sync check and the Jasmine suite, through `docker-compose` / `make` as described in `AGENTS.md`.

## Notes

- No new error codes: everything the panel can show is either a new key above or an existing `api_tokens_page.*` / `errors.*` key.
