# Plan: Add User Avatar

Issue: [528-add-user-avatar.md](../issues/528-add-user-avatar.md)

## Overview

Backend adds a `UserProfile.email_hash` field (SHA-256 of the trimmed/lowercased
`User.email`), kept in sync whenever the profile is saved and explicitly refreshed on
account-email update, plus a data migration backfilling it for all existing users. A new
`GRAVATAR_BASE_URL`-style setting (env-var-backed, with a default) is combined with
`email_hash` into an `avatar_url` field returned by `MyAccountDetailSerializer` (null when
there's no hash). Frontend adds a reusable `Avatar` component (following the existing
`CardAvatar` pattern, with a bundled local placeholder fallback) and renders it in the
top-left corner of the `/#/my_account` page only — the header nav icon is untouched.
Translator adds the new alt-text key this component needs, in both `en.yaml` and `pt.yaml`.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### `avatar_url` (backend produces, frontend consumes)

`MyAccountDetailSerializer` (`backend/games/serializers/auth/my_account_detail.py`) gains a
new read-only field:

```python
avatar_url = serializers.SerializerMethodField()

def get_avatar_url(self, user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    if not profile.email_hash:
        return None
    return f'{Settings.gravatar_base_url()}{profile.email_hash}'
```

- Type: `string | null`. Null whenever the user has no email (no `email_hash`).
- Included in both the `GET /users/account.json` response and the `PATCH
  /users/account.json` response (the view re-serializes with `MyAccountDetailSerializer`
  after a successful update either way — no view change needed for this field).
- Built from `Settings.gravatar_base_url()` (new `backend/games/settings.py` static method,
  env var `MAJORA_GRAVATAR_BASE_URL`, default `https://gravatar.com/avatar/`) concatenated
  directly with `email_hash` — the default already ends in `/`, so no extra separator is
  added in code.

### `Avatar` component (frontend-internal, frontend agent's own steps)

New `frontend/assets/js/components/common/Avatar.jsx`, modeled on the existing
`CardAvatar.jsx`: takes `{ url, alt }` props, renders an `<img>`, and falls back to a new
bundled placeholder image (`frontend/assets/images/placeholders/default_avatar.png`) when
`url` is null/undefined. Rendered only on `/#/my_account`
(`MyAccountHelper.jsx`), fed by `avatarUrl` state populated from the `account.avatar_url`
field of the `/users/account.json` response. The header nav icon
(`HeaderHelper.jsx`) is explicitly out of scope and stays as the static icon it is today.

### Alt-text translation key (translator produces, frontend consumes)

New key `my_account_page.avatar_alt` alongside the existing `my_account_page.*` namespace
in both `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`. The frontend
agent's `Avatar` usage in `MyAccountHelper.jsx` passes `Translator.t('my_account_page.avatar_alt')`
as the `alt` prop.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`) — covers the account view/serializer tests
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`) — covers model, migration, and settings tests
- `frontend`: `npm test` / `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- **Why `email_hash` isn't simply computed in a generic `UserProfile.save()` override
  alone**: `User.email` lives on Django's built-in `auth.User`, which this app does not
  own and cannot override `save()` on. Email changes happen via
  `MyAccountUpdateSerializer.update()` (calls `instance.save()` directly on the `User`),
  and at registration via `User.objects.create_user(...)`
  (`backend/games/views/auth/_shared.py:_create_registered_user`) — neither touches
  `UserProfile`. See `backend.md` for the exact mechanism (recompute inside
  `UserProfile.save()`, explicitly re-saving the profile from `MyAccountUpdateSerializer.update()`
  after the email changes; registration needs no extra step since the profile is already
  created lazily on first access, e.g. by the `status` endpoint).
- No new endpoint and no new authorization surface — `data-access`/`security` review isn't
  expected to be load-bearing, but `avatar_url` is a new field exposed on the account
  serializer (own-account-only, `IsAuthenticated`), worth a quick look.
- `default_avatar.png` is a new bundled image asset (no such placeholder exists yet, unlike
  `default_character.png`/`default_game.png`/`default_treasure.png`) — the frontend agent
  needs to add a real placeholder image file, not just reference one.
