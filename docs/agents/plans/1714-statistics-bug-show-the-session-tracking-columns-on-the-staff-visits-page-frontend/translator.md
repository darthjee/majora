# Translator Plan: Statistics bug: show the session tracking columns on the staff visits page (frontend)

Main plan: [plan.md](plan.md)

## Shared contracts

Translation keys under `staff_statistics_page.visit_list` (in `frontend/assets/i18n/en/staff_statistics_page.yaml` and `pt/`):

| Key | `en` |
|-----|------|
| `paths` | Paths |
| `session` | Session |
| `first_path` | First |
| `last_path` | Last |
| `session_first_path` | First path |
| `creation_reason` | Reason |
| `first_seen_logged` | Logged in at creation |
| `yes` | yes |
| `no` | no |
| `unknown` | unknown |
| `creation_reasons.no_cookie` | No cookie |
| `creation_reasons.invalid_cookie` | Invalid cookie |
| `creation_reasons.cookie_session_not_found` | Cookie session not found |
| `creation_reasons.domain_changed` | Domain changed |
| `creation_reasons.ip_changed` | IP changed |
| `creation_reasons.login_rotation` | Login rotation |

The frontend looks reasons up as `creation_reasons.<raw value>` and falls back to the raw value
for an unknown one; the translator must keep the `creation_reasons` keys equal to the six raw
values.

## Implementation Steps

### Step 1 — Visit list tracking keys

Add the keys above under `staff_statistics_page.visit_list` in `en` (the values in the table)
and `pt` (Portuguese equivalents, e.g. `paths: Caminhos`, `session: Sessão`,
`unknown: desconhecido`, `creation_reasons.no_cookie: Sem cookie`,
`creation_reasons.login_rotation: Rotação no login`). Keep both files in the same key order,
and run the translation sync check.

## Files to Change

- `frontend/assets/i18n/en/staff_statistics_page.yaml` — new `visit_list` keys.
- `frontend/assets/i18n/pt/staff_statistics_page.yaml` — Portuguese translations.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- The `creation_reasons` keys must match the six raw values exactly (`no_cookie`,
  `invalid_cookie`, `cookie_session_not_found`, `domain_changed`, `ip_changed`,
  `login_rotation`).
- `visit_list` already has `unknown_domain`; the new `unknown` key is separate.
