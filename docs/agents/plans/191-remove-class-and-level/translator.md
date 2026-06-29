# Translator Plan: Remove Class and Level

Main plan: [plan.md](plan.md)

## Shared contracts

The `frontend` agent depends on the following i18n keys being present (with the exact key names shown):

**Remove:**
```yaml
character_info:
  class_label: ...
  level_label: ...

pc_edit_page:
  character_class_label: ...
  level_label: ...

npc_edit_page:
  character_class_label: ...
  level_label: ...
```

**Add:**
```yaml
character_info:
  role_label: 'Role:'        # pt: 'Função:'

pc_edit_page:
  role_label: Role           # pt: Função

npc_edit_page:
  role_label: Role           # pt: Função
```

## Implementation Steps

### Step 1 — Update en.yaml

In `frontend/assets/i18n/en.yaml`:

- Under `character_info:` — remove `class_label` and `level_label`; add `role_label: 'Role:'`.
- Under `pc_edit_page:` — remove `character_class_label` and `level_label`; add `role_label: Role`.
- Under `npc_edit_page:` — remove `character_class_label` and `level_label`; add `role_label: Role`.

### Step 2 — Update pt.yaml

In `frontend/assets/i18n/pt.yaml`:

- Under `character_info:` — remove `class_label` and `level_label`; add `role_label: 'Função:'`.
- Under `pc_edit_page:` — remove `character_class_label` and `level_label`; add `role_label: Função`.
- Under `npc_edit_page:` — remove `character_class_label` and `level_label`; add `role_label: Função`.

### Step 3 — Verify key parity

Run the translation key parity check if one exists:
```bash
docker-compose run --rm frontend yarn check-i18n 2>/dev/null || true
```

### Step 4 — Commit

```bash
scripts/commit_change.sh "feat(translator): replace class/level i18n keys with role (issue #191)" "claude-sonnet-4-6" "claude-sonnet-4-6@anthropic.com"
```

> Resolve `commit_change.sh` relative to the `auto-fix-issue` skill folder.

## Files to Change

- `frontend/assets/i18n/en.yaml` — replace class/level keys with role_label
- `frontend/assets/i18n/pt.yaml` — replace class/level keys with role_label

## Notes

- Keep the key removal and addition in the same sections they currently live in (do not reorder surrounding keys).
- The Portuguese word for "role" in the RPG sense is "Função" (function/role).
