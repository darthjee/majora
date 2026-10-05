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
 *   select. `GET.visits` (`/staff/statistics/visits.json`, issue #1507) returns the Visits
 *   tab's zero-filled buckets and totals (anonymous / logged-in) for the requested filters.
 *   `GET.overview` (`/staff/statistics/overview.json`, issue #1504) returns the Overview
 *   tab's KPI totals (no buckets) for the requested filters. `GET.visitors`
 *   (`/staff/statistics/visitors.json`, issue #1510) returns the Visitors tab's zero-filled
 *   buckets and totals (unique / new / returning / anonymous / logged-in visitors).
 *   `GET.duration` (`/staff/statistics/duration.json`, issue #1514) returns the Duration
 *   tab's zero-filled buckets, totals (visits, single-hit visits, average / median duration
 *   and hits) and the fixed 8-bin duration histogram. `GET.domainsSummary`
 *   (`/staff/statistics/domains/summary.json`, issue #1517) returns the Domains tab's
 *   per-domain rows (the "unknown" row last) and totals. `GET.usersRanking`
 *   (`/staff/statistics/users.json`, issue #1520) returns the Users tab's paginated plain
 *   array of logged-in user rows, ordered server-side by the `sort` query param.
 *   Each statistics tab adds its own quantity type (e.g. `overview`, `visits`, `visitors`,
 *   `duration`, `domainsSummary`, `usersRanking`); their filters travel as the request query
 *   (see `StatisticsQuery`).
 */
const domains = { path: () => '/staff/statistics/domains.json', permission: null };
const overview = { path: () => '/staff/statistics/overview.json', permission: null };
const visits = { path: () => '/staff/statistics/visits.json', permission: null };
const visitors = { path: () => '/staff/statistics/visitors.json', permission: null };
const duration = { path: () => '/staff/statistics/duration.json', permission: null };
const domainsSummary = { path: () => '/staff/statistics/domains/summary.json', permission: null };
const usersRanking = { path: () => '/staff/statistics/users.json', permission: null };

export default {
  GET: {
    domains: { regular: domains, private: domains },
    overview: { regular: overview, private: overview },
    visits: { regular: visits, private: visits },
    visitors: { regular: visitors, private: visitors },
    duration: { regular: duration, private: duration },
    domainsSummary: { regular: domainsSummary, private: domainsSummary },
    usersRanking: { regular: usersRanking, private: usersRanking },
  },
};
