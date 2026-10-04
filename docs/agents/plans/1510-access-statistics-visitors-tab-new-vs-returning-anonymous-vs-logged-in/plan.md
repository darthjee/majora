# Plan: Access statistics: Visitors tab (new vs returning, anonymous vs logged-in)

Issue: [1510-access-statistics-visitors-tab-new-vs-returning-anonymous-vs-logged-in.md](../../issues/1510-access-statistics-visitors-tab-new-vs-returning-anonymous-vs-logged-in.md)

## Overview
Replace the Visitors tab placeholder with the full tab described in `docs/agents/specs/access-statistics/visitors.md` ("Filters", "Chart and layout"): a summary row of range totals rendered with `StatisticsKpiTile`, and two stacked Recharts bar charts (new vs returning, anonymous vs logged-in) over the zero-filled buckets of `GET /staff/statistics/visitors.json` (#1509, merged). The layering mirrors the merged Visits tab (#1507); the Visits series helper is generalized so both tabs share it, and `StatisticsKpiTile`'s `href` becomes optional.

## Agents involved

- [translator](translator.md)
- [frontend](frontend.md)

## Shared contracts

i18n keys added under `staff_statistics_page.visitors` in `frontend/assets/i18n/{en,pt}/staff_statistics_page.yaml` (a **new** top-level `visitors:` map next to `visits:` and `overview:` — the existing `tabs.visitors` key stays as is):

| Key | English | Portuguese |
|-----|---------|------------|
| `title` | Visitors over time | Visitantes ao longo do tempo |
| `unique_visitors` | Unique visitors | Visitantes únicos |
| `new` | New | Novos |
| `returning` | Returning | Recorrentes |
| `returning_share` | Returning share | Proporção de recorrentes |
| `anonymous` | Anonymous | Anônimos |
| `logged_in` | Logged-in | Logados |
| `logged_in_share` | Logged-in share | Proporção de logados |
| `total` | Total | Total |
| `new_returning_title` | New vs returning | Novos vs recorrentes |
| `audience_title` | Anonymous vs logged-in | Anônimos vs logados |
| `totals_note` | Range totals are not sums of the bars: a visitor seen in several periods counts once. | Os totais do período não são a soma das barras: um visitante visto em vários períodos conta uma vez. |
| `first_visit_note` | "New" means first visit recorded; visits before tracking started are not counted. | "Novo" significa primeira visita registrada; visitas anteriores ao início do rastreamento não são contadas. |
| `empty` | No visitors in this range | Nenhum visitante neste período |
| `load_error` | Unable to load visitors. | Não foi possível carregar os visitantes. |

Portuguese wording should match the tone of the existing `visits` / `overview` pt strings (translator may adjust wording, not keys). Series labels in legends and tooltips use `visitors.new`, `visitors.returning`, `visitors.anonymous`, `visitors.logged_in`.
