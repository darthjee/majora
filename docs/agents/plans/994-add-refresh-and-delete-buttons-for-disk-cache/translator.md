# Translator Plan: Add refresh and delete buttons for disk cache

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend agent's `ClearCacheConfirmModalHelper.jsx` calls `Translator.t()` with these exact
keys — they must exist in both language files before frontend CI (`check_i18n`) passes:

- `clear_cache_confirm_modal.title`
- `clear_cache_confirm_modal.body`
- `clear_cache_confirm_modal.cancel`
- `clear_cache_confirm_modal.confirm`

## Context

`frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml` are flat, alphabetically-ish
grouped-by-feature YAML files, each key a **top-level** namespace with flat sub-keys (no 3-level
nesting anywhere in either file). The existing `delete_photo_confirm_modal` and
`slain_confirm_modal` top-level keys are the exact precedent to follow for a confirmation modal's
strings — do not nest the new key inside `staff_dashboard:`.

`en.yaml`'s existing entry (for reference — style/wording precedent):

```yaml
delete_photo_confirm_modal:
  title: Delete Photo
  body: Are you sure you want to delete this photo? This cannot be undone.
  confirm: Delete
  cancel: Cancel
```

`pt.yaml`'s matching entry:

```yaml
delete_photo_confirm_modal:
  title: Excluir Foto
  body: Tem certeza de que deseja excluir esta foto? Esta ação não pode ser desfeita.
  confirm: Excluir
  cancel: Cancelar
```

This new modal is generic across both cache cards (Memory and Disk) — the card's own title
("Memory Cache"/"Disk Cache") already gives context, so `body` should stay generic and not name a
specific cache type.

## Implementation Steps

### Step 1 — Add `clear_cache_confirm_modal` to `en.yaml`

Insert alphabetically (near `clear_cache_tooltip`/`checks`-adjacent entries, or wherever this
file's existing loose alphabetical grouping puts a `c`-prefixed top-level key — follow whatever
the file's own ordering convention actually is at the insertion point):

```yaml
clear_cache_confirm_modal:
  title: Clear Cache
  body: This action cannot be undone.
  confirm: Clear Cache
  cancel: Cancel
```

### Step 2 — Add the matching entry to `pt.yaml`

Portuguese translation, same key structure, at the equivalent position in that file:

```yaml
clear_cache_confirm_modal:
  title: Limpar Cache
  body: Esta ação não pode ser desfeita.
  confirm: Limpar Cache
  cancel: Cancelar
```

### Step 3 — Verify sync

Run the repo's translation-sync check locally to confirm both files stay in lockstep (same keys,
no orphans) before handing off to the frontend agent.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `clear_cache_confirm_modal` top-level key.
- `frontend/assets/i18n/pt.yaml` — add matching `clear_cache_confirm_modal` top-level key.

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- No interpolation/variables needed in `body` — kept intentionally generic per the issue's decided
  design (see `plan.md`'s "Shared contracts").
- This can proceed independently of and in parallel with the proxy/frontend work — it has no
  dependency on either.
