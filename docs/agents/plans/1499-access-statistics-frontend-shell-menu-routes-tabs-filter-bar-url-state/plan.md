# Plan: Access statistics: frontend shell (menu, routes, tabs, filter bar, URL state)

Issue: [1499-access-statistics-frontend-shell-menu-routes-tabs-filter-bar-url-state.md](../../issues/1499-access-statistics-frontend-shell-menu-routes-tabs-filter-bar-url-state.md)

## Overview

Build the shared frontend shell of the staff access statistics page (#1477), per the
**Navigation and routes**, **Filter bar controls**, **URL query state** and **RequestStore**
sections of `docs/agents/specs/access-statistics/shared-infrastructure.md`: menu entry, seven gated routes, `StaffStatisticsShell` with a
query-carrying tab nav and the filter bar, URL-backed filter state (`statisticsHref`,
`StatisticsQuery`) and the `staffStatistics` RequestStore resource (`domains` quantity type).
Tab bodies are placeholders; Recharts (#1500) and tab content are out of scope.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### Translation keys

**`frontend/assets/i18n/{en,pt}/common.yaml`** — under `header`, after `nav_staff_photos`:

| Key | en | pt |
|-----|----|----|
| `header.nav_staff_statistics` | Access statistics | Estatísticas de acesso |

**New namespace `staff_statistics_page`** in `frontend/assets/i18n/{en,pt}/staff_statistics_page.yaml` (loaded on demand by filename; no registration needed). No interpolation: compound labels such as "Auto (week)" are composed in JSX from separate keys.

| Key | en | pt |
|-----|----|----|
| `staff_statistics_page.title` | Access statistics | Estatísticas de acesso |
| `staff_statistics_page.placeholder` | This tab is not available yet. | Esta aba ainda não está disponível. |
| `staff_statistics_page.tabs.overview` | Overview | Visão geral |
| `staff_statistics_page.tabs.visits` | Visits | Visitas |
| `staff_statistics_page.tabs.visitors` | Visitors | Visitantes |
| `staff_statistics_page.tabs.duration` | Duration | Duração |
| `staff_statistics_page.tabs.domains` | Domains | Domínios |
| `staff_statistics_page.tabs.users` | Users | Usuários |
| `staff_statistics_page.tabs.visit_list` | Visit list | Lista de visitas |
| `staff_statistics_page.filters.range` | Date range | Período |
| `staff_statistics_page.filters.ranges.7d` | Last 7 days | Últimos 7 dias |
| `staff_statistics_page.filters.ranges.30d` | Last 30 days | Últimos 30 dias |
| `staff_statistics_page.filters.ranges.90d` | Last 90 days | Últimos 90 dias |
| `staff_statistics_page.filters.ranges.12m` | Last 12 months | Últimos 12 meses |
| `staff_statistics_page.filters.ranges.custom` | Custom | Personalizado |
| `staff_statistics_page.filters.from` | From | De |
| `staff_statistics_page.filters.to` | To | Até |
| `staff_statistics_page.filters.user` | User | Usuário |
| `staff_statistics_page.filters.user_any` | Any user | Qualquer usuário |
| `staff_statistics_page.filters.user_search_placeholder` | Search users... | Buscar usuários... |
| `staff_statistics_page.filters.user_no_results` | No users found. | Nenhum usuário encontrado. |
| `staff_statistics_page.filters.user_deleted` | deleted user | usuário removido |
| `staff_statistics_page.filters.user_clear` | Clear | Limpar |
| `staff_statistics_page.filters.domain` | Domain | Domínio |
| `staff_statistics_page.filters.domain_any` | Any domain | Qualquer domínio |
| `staff_statistics_page.filters.domain_unknown` | Unknown | Desconhecido |
| `staff_statistics_page.filters.audience` | Audience | Público |
| `staff_statistics_page.filters.audiences.all` | All | Todos |
| `staff_statistics_page.filters.audiences.anonymous` | Anonymous | Anônimos |
| `staff_statistics_page.filters.audiences.logged_in` | Logged-in | Logados |
| `staff_statistics_page.filters.granularity` | Granularity | Granularidade |
| `staff_statistics_page.filters.granularities.auto` | Auto | Automática |
| `staff_statistics_page.filters.granularities.day` | Day | Dia |
| `staff_statistics_page.filters.granularities.week` | Week | Semana |
| `staff_statistics_page.filters.granularities.month` | Month | Mês |
| `staff_statistics_page.filters.reset` | Reset | Limpar filtros |

The frontend agent may add a key it finds missing while implementing, as long as it lands in both languages (`yarn check_i18n` enforces parity).
