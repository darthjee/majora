## Routing

Routes are registered in `utils/HashRouteResolver.js`, one `register(pattern, pageName)`
call per route. `HashRouteResolver.getPage()` strips the query string before matching, so
`#/games?page=2&per_page=10` resolves to `'games'`. Pagination parameters are extracted
separately via `getPaginationParams()`.

## Pagination

The pagination element set lives in `components/common/pagination/` (`Pagination.jsx`,
`PageLink.jsx`, `helpers/PaginationHelper.jsx`, `controllers/PaginationController.js`,
`controllers/PaginationBuilder.js`), since it's shared across every resource. See
[pagination.md](pagination.md) for the full breakdown, including the ellipsis algorithm and
the `<Pagination>` prop contract.
