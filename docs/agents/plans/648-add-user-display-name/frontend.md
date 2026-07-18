# Frontend Plan: Add user display name

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section for the full field/endpoint list. In short:
`GET`/`PATCH /users/account.json` gain a `display_name` field (alongside the existing `name`);
`POST /users/register.json` requires a `display_name` key in the request body; a duplicate
`display_name` on register returns `{"error": "display name already exists"}`, and on
my-account update returns `errors.display_name` on a `400`. Session-message and poll-voter
`user.name` values change meaning server-side (now the display name, not the username) with no
key/shape change — no code changes needed at those two render sites.

## Implementation Steps

### Step 1 — Register page gains `display_name`

- `frontend/assets/js/client/AuthClient.js::register` — add a `displayName` parameter, sending
  it as `display_name` in the POST body alongside `name`/`email`/`password`/
  `password_confirmation`.
- `frontend/assets/js/components/resources/account/pages/Register.jsx` — add a `displayName`
  state field (`useState('')`), pass it through to `controller.handleSubmit` and down to
  `RegisterHelper.render` (state + `onDisplayNameChange` handler), following the exact pattern
  already used for `name`.
- `frontend/assets/js/components/resources/account/pages/controllers/RegisterController.js::handleSubmit`
  — accept and forward `displayName` to `this.client.register(...)`.
- `frontend/assets/js/components/resources/account/pages/helpers/RegisterHelper.jsx` — add a
  `FormField` for `display_name` (new translation keys, see Step 3), placed after the `name`
  field per the issue's field ordering (`name`, then `display_name`, then `email`, ...).

### Step 2 — My Account page gains `display_name`

- `frontend/assets/js/client/AuthClient.js::updateAccount` — accept `displayName` in the
  destructured `account` argument, send it as `display_name` in the PATCH body.
- `frontend/assets/js/components/resources/account/pages/MyAccount.jsx` — add a `displayName`
  state field, thread it through `controller` construction is unaffected (controller reads
  prefill values via its own fetch), pass it into `formValues` for `submitForm` and into
  `MyAccountHelper.render`'s state/handlers, plus an `onDisplayNameChange` handler.
- `frontend/assets/js/components/resources/account/pages/controllers/MyAccountController.js` —
  add a `setDisplayName` setter parameter (constructor + `#fetchAccount`, prefilling from
  `account.display_name ?? ''`), and surface `fieldErrors.display_name` the same way
  `fieldErrors.name` already is.
- `frontend/assets/js/components/resources/account/pages/helpers/MyAccountHelper.jsx` — add a
  `FormField` for `display_name` with its own `errors={formState.fieldErrors.display_name ??
  []}`, placed after the `name` field.

### Step 3 — Translations

- `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml` — add
  `register_page.display_name_label` and `my_account_page.display_name_label` keys (English:
  "Display name"; Portuguese: match the existing tone/casing of neighboring keys in that file).
  Only two keys in two files — small enough to handle directly here rather than involving the
  `translator` agent, per this project's precedent for small additions (see issue #632's
  frontend plan notes). Run `.claude/scripts/check_translations.sh` (or whatever this project's
  standard translation-sync check is) after adding, to confirm both languages stay in sync.

### Step 4 — Specs

- Add/update Jasmine specs mirroring every file touched above (`Register.jsx`,
  `RegisterController.js`, `RegisterHelper.jsx`, `MyAccount.jsx`, `MyAccountController.js`,
  `MyAccountHelper.jsx`, `AuthClient.js`) under `frontend/specs/`, following this project's
  existing mirrored spec-tree convention.

## Files to Change

- `frontend/assets/js/client/AuthClient.js`
- `frontend/assets/js/components/resources/account/pages/Register.jsx`
- `frontend/assets/js/components/resources/account/pages/controllers/RegisterController.js`
- `frontend/assets/js/components/resources/account/pages/helpers/RegisterHelper.jsx`
- `frontend/assets/js/components/resources/account/pages/MyAccount.jsx`
- `frontend/assets/js/components/resources/account/pages/controllers/MyAccountController.js`
- `frontend/assets/js/components/resources/account/pages/helpers/MyAccountHelper.jsx`
- `frontend/assets/i18n/en.yaml`, `frontend/assets/i18n/pt.yaml`
- Corresponding specs under `frontend/specs/` mirroring every file above

## CI Checks

- `frontend`: `yarn coverage` (CI job: `jasmine`)
- `frontend`: `yarn lint` (CI job: `frontend-checks`)

## Notes

- Run inside the project containers per `AGENTS.md` (`docker-compose run --rm majora_fe
  yarn ...`), never directly on the host.
- No visible change is needed where session-message authors or poll voters are rendered
  (`SessionMessagesHelper.jsx`, `GamePollHelper.jsx`) — they already just read `user.name`,
  which now resolves server-side to the display name.
- Field ordering on both forms: keep `name` (real username, editable only on my-account, not on
  register since it's the chosen login) before the new `display_name` field, matching the
  issue's listed order and the existing `name` → `first_name` → `last_name` → `email` layout on
  my-account.
