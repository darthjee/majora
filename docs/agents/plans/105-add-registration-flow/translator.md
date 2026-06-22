# Translator Plan: Add registration flow

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the i18n keys consumed by [frontend.md](frontend.md)'s `Register` page, the login-modal
register link, and the header register link.

## Implementation Steps

### Step 1 — Add new keys to `frontend/assets/i18n/en.yaml` and `pt.yaml`

Add a new `register_page` namespace plus two new keys reused under `login_modal` and `header`,
mirroring the existing `recover`-flow naming style:

```yaml
header:
  register: Register   # pt: Registrar
login_modal:
  register_link: Create an account   # pt: Criar uma conta
register_page:
  title: Register
  name_label: Name
  email_label: Email
  password_label: Password
  password_confirmation_label: Confirm password
  submit: Register
  error: An unexpected error occurred, please try again later.
```

(Exact English/Portuguese wording is a judgment call — keep tone consistent with the existing
`login_modal`/`header` entries already in both files.)

### Step 2 — Verify parity

Run the translation-sync check after editing both files:

```bash
docker-compose run --rm majora_fe npm run check_i18n
```

## Files to Change
- `frontend/assets/i18n/en.yaml` — add `header.register`, `login_modal.register_link`, and the
  `register_page` namespace.
- `frontend/assets/i18n/pt.yaml` — same keys, Portuguese translations.

## CI Checks
- `frontend/`: `npm run check_i18n` (CI job: `frontend-checks` — "Check translations")

## Notes
- Coordinate exact key names with [frontend.md](frontend.md) before the frontend agent wires up
  `Translator.t(...)` calls — if frontend lands first with placeholder keys, reconcile names here
  rather than duplicating keys.
