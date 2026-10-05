# Translator Plan: Access statistics: Duration tab (duration, hits per visit and histogram charts)

Main plan: [plan.md](plan.md)

## Shared contracts

Add the `staff_statistics_page.duration.*` keys listed in [plan.md](plan.md#shared-contracts), exactly as named. Use the English texts given there, and translate them into Portuguese for `pt`.

## Implementation Steps

### Step 1 — Add the Duration tab strings
Add a `duration:` block to `staff_statistics_page.yaml` in both languages. Place it after the `visitors:` block, with the 13 metric/state keys and the nested `bins:` map of 8 bin labels. Suggested Portuguese texts:

| Key | pt |
|-----|----|
| `title` | Duração das visitas ao longo do tempo |
| `visits` | Visitas |
| `average_duration` | Duração média |
| `median_duration` | Duração mediana |
| `average_hits` | Média de acessos por visita |
| `median_hits` | Mediana de acessos por visita |
| `single_hit_share` | Visitas de um único acesso |
| `duration_chart` | Duração das visitas |
| `hits_chart` | Acessos por visita |
| `histogram_chart` | Distribuição das durações |
| `histogram_share` | Parcela das visitas |
| `empty` | Nenhuma visita neste período |
| `load_error` | Não foi possível carregar as durações das visitas. |

The bin labels (`0 s`, `<30 s`, `30 s–1 m`, `1–3 m`, `3–10 m`, `10–30 m`, `30 m–1 h`, `≥1 h`) are the same in both languages. Quote the values that start with `<` or `≥`, or that contain `:`, as YAML needs.

## Files to Change
- `frontend/assets/i18n/en/staff_statistics_page.yaml`: new `duration` block.
- `frontend/assets/i18n/pt/staff_statistics_page.yaml`: new `duration` block.

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (`.claude/scripts/check_translations.sh`)

## Notes
- Keep both files structurally identical, since `check_i18n` compares their key sets.
