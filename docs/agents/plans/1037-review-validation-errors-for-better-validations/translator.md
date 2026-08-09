# Translator Plan: Review validation errors for better validations

Main plan: [plan.md](plan.md)

## Shared contracts

- `backend` produces the final list of error codes (Steps 2–4 of [backend.md](backend.md)) —
  one entry is needed per code, under a new `errors:` namespace in both locale files.
- `frontend` reads these via `Translator.t(\`errors.${code}\`, code)` — the key path is always
  `errors.<code>`.

## Implementation Steps

### Step 1 — Add the `errors:` namespace

Add an `errors:` top-level key to `frontend/assets/i18n/en.yaml` and `pt.yaml`, with one entry per
code introduced by `backend`. Cover at minimum the generic DRF-derived codes and the custom
business-logic codes identified in [backend.md](backend.md)'s Step 3, for example:

```yaml
errors:
  max_length: "This field is too long."
  required: "This field is required."
  blank: "This field cannot be blank."
  unique: "This value is already in use."
  invalid: "This value is invalid."
  not_found: "Not found."
  not_allowed: "You are not allowed to do this."
  authentication_required: "Authentication is required."
  session_wrong_game: "Session must belong to the same game."
  max_tags_exceeded: "An STL model may have at most 20 tags."
  tag_name_too_long: "Tag name is too long."
  poll_not_open: "Poll must be open to accept votes."
```

(Exact code list and count depends on `backend`'s Step 3/4 audit — coordinate to get the final
list rather than guessing every one up front.)

### Step 2 — Verify

Run the key-sync check and fix any drift between locale files:

```bash
docker-compose run --rm majora_fe yarn check_i18n
```

## Files to Change

- `frontend/assets/i18n/en.yaml`
- `frontend/assets/i18n/pt.yaml`

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)

## Notes

- Keep keys identical across every locale file — `check_i18n` fails the build otherwise.
- Coordinate with `backend` for the authoritative code list before considering this done; codes
  discovered late in `backend`'s audit (Step 4) still need an entry here.
