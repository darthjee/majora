# Translator Plan: Statistics bug: statistics:read scope in the token and device-authorization UI (frontend)

Main plan: [plan.md](plan.md)

## Shared contracts

The translation keys listed in [plan.md](plan.md#shared-contracts), in `en` and `pt`.

## Implementation Steps

### Step 1 — Token page keys

Add the statistics group label, `family_statistics` and `family_statistics_help` to
`api_tokens_page.yaml` in `en` and `pt`, following how existing group labels are named in that
file. The help text must say it gives access to visitor IP addresses and visit history.

### Step 2 — Approval screen keys

Add `authorize_token_modal_title`, `authorize_token_modal_body`, `scopes_label` and
`statistics_warning` to `authorization_requests_page.yaml` in `en` and `pt`, then run the
translation-key sync check.

## Files to Change

- `frontend/assets/i18n/en/api_tokens_page.yaml`
- `frontend/assets/i18n/pt/api_tokens_page.yaml`
- `frontend/assets/i18n/en/authorization_requests_page.yaml`
- `frontend/assets/i18n/pt/authorization_requests_page.yaml`

## CI Checks

- `frontend`: the translation-key sync check and Jasmine through docker-compose (CI jobs:
  `frontend-checks`, `jasmine`)
