# Translator Plan: Add view as for admin and DMs

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md) for the exact keys the frontend agent will call via
`Translator.t()`.

## Step 1 — Add `header.view_as_alt`

In both `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`, add a
`view_as_alt` key to the existing `header:` namespace, alongside `my_account_alt`
(en.yaml lines 1-13). Suggested English value: `View as`.

## Step 2 — Add the `view_as_modal` namespace

Add a new top-level `view_as_modal:` namespace to both `en.yaml` and `pt.yaml`,
mirroring the shape of the existing `login_modal:` namespace (title, field/checkbox
labels, `cancel`, a save/submit key):

```yaml
view_as_modal:
  title: View as
  enabled_label: Simulate a different role
  role_dm: Game Master
  role_player: Player
  role_owner: Character owner
  cancel: Cancel
  save: Save
```

Provide the Portuguese (`pt.yaml`) equivalents following the existing translation style
already used for `login_modal`/`header` in that file.

## Step 3 — Verify key sync

Run the project's translation-key-sync check (per `docs/agents/i18n.md`) to confirm
`en.yaml` and `pt.yaml` stay in sync after adding both the `header.view_as_alt` key and
the new `view_as_modal` namespace.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `header.view_as_alt`, new `view_as_modal`
  namespace
- `frontend/assets/i18n/pt.yaml` — same, Portuguese translations

## CI Checks

- Whatever local command `docs/agents/i18n.md` documents for the translation-key-sync
  check.
