# Plan: Access statistics: Visit list tab (paginated visit table)

Issue: [1523-access-statistics-visit-list-tab-paginated-visit-table.md](../../issues/1523-access-statistics-visit-list-tab-paginated-visit-table.md)

## Overview

Replace the Visit list tab placeholder with a paginated visit table that is sorted on the server and reads
`GET /staff/statistics/visit-list.json` (#1522, merged). The tab mirrors the Users tab (#1520)
layering: page → Body → Controller → page Helper → Table (element + element helper). The
Users tab's `usersSort.js` becomes a shared sort factory reused by both tabs. Spec:
`docs/agents/specs/access-statistics/visit-list.md` ("Filters", "Chart and layout", "API").

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

i18n keys under `staff_statistics_page.visit_list` (in `frontend/assets/i18n/{en,pt}/staff_statistics_page.yaml`,
next to `users:`). The frontend reads them through `Translator.t('staff_statistics_page.visit_list.<key>')`:

| Key | en | pt |
|-----|----|----|
| `title` | Visit list | Lista de visitas |
| `user` | User | Usuário |
| `ip` | IP | IP |
| `domain` | Domain | Domínio |
| `started_at` | Start | Início |
| `last_seen` | Last seen | Visto por último |
| `duration` | Duration | Duração |
| `hits` | Hits | Acessos |
| `anonymous` | Anonymous | Anônimo |
| `unknown_domain` | unknown | desconhecido |
| `ongoing` | ongoing | em andamento |
| `profile` | Profile | Perfil |
| `sorted_descending` | Sorted descending | Ordenado de forma decrescente |
| `empty` | No visits in this range. | Nenhuma visita neste período. |
| `load_error` | Unable to load visits. | Não foi possível carregar as visitas. |

`load_error` is not in the spec's key list. It is added to match the Users tab
(`users.load_error`), which the controller uses for its error state. The anonymous cell renders
`${t('anonymous')} · #${sessionId}` in code; the key holds only the word.
