# Translator Plan: Improve staff dashboard

Main plan: [plan.md](plan.md)

## Shared contracts

Frontend consumes these keys via `Translator.t('<namespace>.<key>')` — see
[frontend.md](frontend.md) for every call site. Keys must be added identically
(same key names) to both `frontend/assets/i18n/en.yaml` and
`frontend/assets/i18n/pt.yaml`.

## Implementation Steps

### Step 1 — Header nav key

Add one new key to the existing `header:` namespace in both locale files, right
after `nav_staff_users` (matching the order the "Staff Users" and new
"Dashboard" links appear in the Admin dropdown):

| Key | en | pt |
|---|---|---|
| `header.nav_staff_dashboard` | `Dashboard` | `Dashboard` |

(Per the issue: "in portuguese will also be called Dashboard".)

### Step 2 — New `staff_dashboard:` keys

Add three new keys to the existing `staff_dashboard:` namespace (both files),
alongside the current `title`/`loading`/`clear_cache_tooltip`/
`clear_cache_success`/`clear_cache_error` (all reused as-is, no change needed
to those):

| Key | en | pt |
|---|---|---|
| `staff_dashboard.memory_cache_title` | `Memory Cache` | `Cache de Memória` |
| `staff_dashboard.refresh_tooltip` | `Refresh` | `Atualizar` |
| `staff_dashboard.summary_load_error` | `Unable to load cache summary.` | `Não foi possível carregar o resumo do cache.` |

### Step 3 — Verify

Run the sync check after editing both files:

```bash
docker-compose run --rm majora_fe yarn check_i18n
```

## Files to Change

- `frontend/assets/i18n/en.yaml`
- `frontend/assets/i18n/pt.yaml`
