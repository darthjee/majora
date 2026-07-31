# Translator Plan: Refactor permissions and access request for future caching

Main plan: [plan.md](plan.md)

## Shared contracts

Provides the `view_as_modal.not_logged_label` key the frontend plan's [ViewAsModalHelper.jsx step](frontend.md#step-6--add-not-logged-to-the-mock-modal) references via `Translator.t('view_as_modal.not_logged_label')`.

## Implementation Steps

### Step 1 — Add `not_logged_label` to every language file

In `frontend/assets/i18n/en.yaml`, under the `view_as_modal:` block (~line 26, alongside `title`/`enabled_label`/`role_dm`/`role_player`/`role_owner`), add:

```yaml
  not_logged_label: Not Logged
```

In `frontend/assets/i18n/pt.yaml`, under the matching `view_as_modal:` block (~line 26), add the equivalent Portuguese entry, matching the tone of the existing translations (`Ver como`, `Simular outra função`, `Mestre`, `Jogador`, `Dono do personagem`) — e.g.:

```yaml
  not_logged_label: Não conectado
```

Place it directly above `enabled_label`'s translation to mirror the frontend's rendering order (the switch renders above "Game Master", nested under "Simulate a different role").

### Step 2 — Verify translations stay in sync

Run `npm run check_i18n` from `frontend/` to confirm the new key exists with the same shape across every language file.

## Files to Change

- `frontend/assets/i18n/en.yaml` — new `view_as_modal.not_logged_label` key
- `frontend/assets/i18n/pt.yaml` — new `view_as_modal.not_logged_label` key

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- The exact key name (`not_logged_label`) must match what the frontend plan's `ViewAsModalHelper.jsx` references — coordinate before merging if either side needs to shift the name.
