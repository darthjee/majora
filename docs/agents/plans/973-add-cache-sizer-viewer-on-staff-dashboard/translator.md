# Translator Plan: Add cache sizer viewer on staff dashboard

See [plan.md](plan.md) for the overview. Two new keys added to the existing `staff_dashboard`
namespace in both locale files, placed alongside the existing `memory_cache_title`/
`summary_load_error` keys (e.g. right after `summary_load_error`).

## `frontend/assets/i18n/en.yaml`

Within the existing `staff_dashboard:` block:

```yaml
  disk_cache_title: Disk Cache
  disk_cache_load_error: Unable to load disk cache size.
```

## `frontend/assets/i18n/pt.yaml`

Within the existing `staff_dashboard:` block:

```yaml
  disk_cache_title: Cache em Disco
  disk_cache_load_error: Não foi possível carregar o tamanho do cache em disco.
```

The existing `staff_dashboard.loading` key ("Loading dashboard..." / "Carregando painel...") is
reused as-is — same key `MemoryCacheCard` already reuses for its own per-card loading state, no
new key needed for that.

Verify both files' key sets stay identical after the addition:

```bash
docker-compose run --rm majora_fe yarn check_i18n
```

This is the full key set `frontend.md`'s `DiskCacheCardHelper.jsx` references — `disk_cache_title`
for the card title, `disk_cache_load_error` for the error state.
