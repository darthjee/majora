# Translator Plan: Users should be able to update their first and last name

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend agent's `MyAccountHelper.jsx` calls `Translator.t('my_account_page.first_name_label')` and `Translator.t('my_account_page.last_name_label')` for the two new fields. These keys must exist in both locale files before the frontend changes are considered complete (the frontend spec assertions will render these labels).

The frontend agent does **not** change how `my_account_page.name_label` is referenced — only this key's translated value changes, from "Name"/"Nome" to "Username"/"Usuario", matching the wording `login_modal.username_label` already uses in each language (`frontend/assets/i18n/en.yaml:30`, `pt.yaml`).

## Implementation Steps

### Step 1 — Update `en.yaml`
File: `frontend/assets/i18n/en.yaml`, inside the existing `my_account_page:` block:

```yaml
my_account_page:
  title: My Account
  loading: Loading account...
  avatar_alt: User avatar
  name_label: Username
  first_name_label: First name
  last_name_label: Last name
  email_label: Email
  password_label: Password
  password_confirmation_label: Confirm password
  submit: Save changes
  error: Failed to save account. Please try again.
```

(`name_label` changes from `Name` to `Username`; `first_name_label`/`last_name_label` are new, inserted right after it.)

### Step 2 — Update `pt.yaml`
File: `frontend/assets/i18n/pt.yaml`, inside the existing `my_account_page:` block:

```yaml
my_account_page:
  title: Minha Conta
  loading: Carregando conta...
  avatar_alt: Avatar do usuário
  name_label: Usuario
  first_name_label: Nome
  last_name_label: Sobrenome
  email_label: E-mail
  password_label: Senha
  password_confirmation_label: Confirmar senha
  submit: Salvar alterações
```

(`name_label` changes from `Nome` to `Usuario`, matching `login_modal.username_label`'s existing PT value exactly. `first_name_label`/`last_name_label` are new.)

### Step 3 — Verify key sync
Run the project's i18n sync check to confirm no locale is missing a key.

## Files to Change
- `frontend/assets/i18n/en.yaml` — change `my_account_page.name_label` value to "Username"; add `my_account_page.first_name_label` ("First name") and `my_account_page.last_name_label` ("Last name").
- `frontend/assets/i18n/pt.yaml` — change `my_account_page.name_label` value to "Usuario"; add `my_account_page.first_name_label` ("Nome") and `my_account_page.last_name_label` ("Sobrenome").

## CI Checks
- `frontend`: `npm run check_i18n` (keeps locale files in sync; run locally before pushing)

## Notes
- This is a value-only change for `name_label` — do not rename the key itself, since the frontend agent's code keeps referencing `my_account_page.name_label` unchanged (only the label text shown to users changes).
- Do not touch `login_modal.username_label` or any other page's `name_label` (e.g. `register_page.name_label`, `staff_user_page.name_label`) — this issue is scoped to the My Account page only, per the issue's "Expected Behavior" section.
