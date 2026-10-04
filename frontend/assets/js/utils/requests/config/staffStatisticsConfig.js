/**
 * GET resource configuration for `staffStatistics` (issue #1499), the staff-only access
 * statistics endpoints.
 *
 * @description Every endpoint here is staff/superuser-only, gated client-side by the route
 *   gates and `AccessStore.ensureStaffOrSuperUser()`, and enforced server-side too. None has a
 *   separate restricted/full variant, so every `regular`/`private` pair points at the same
 *   object (mirroring `staffUserConfig.js`). There is deliberately no entry in
 *   `RequestPermissionResolvers.js`: it falls back to `NO_PERMISSIONS`.
 *
 *   `GET.domains` (`/staff/statistics/domains.json`) lists every `Domain` row as
 *   `[{id, domain}]`, ordered by `domain` and unpaginated, feeding the filter bar's domain
 *   select. Each statistics tab adds its own quantity type (e.g. `overview`, `visits`); their
 *   filters travel as the request query (see `StatisticsQuery`).
 */
const domains = { path: () => '/staff/statistics/domains.json', permission: null };

export default {
  GET: {
    domains: { regular: domains, private: domains },
  },
};
