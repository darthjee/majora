import { runCases } from './support.js';

const CASES = [
  { hash: '#/staff/users', expected: 'staffUsers' },
  { hash: '#/staff/photos', expected: 'staffPhotos' },
  { hash: '#/staff/statistics', expected: 'staffStatistics' },
  { hash: '#/staff/statistics?range=7d', expected: 'staffStatistics', description: 'ignores the filter query' },
  { hash: '#/staff/statistics/visits', expected: 'staffStatisticsVisits' },
  { hash: '#/staff/statistics/visitors', expected: 'staffStatisticsVisitors' },
  { hash: '#/staff/statistics/duration', expected: 'staffStatisticsDuration' },
  { hash: '#/staff/statistics/domains', expected: 'staffStatisticsDomains' },
  { hash: '#/staff/statistics/users', expected: 'staffStatisticsUsers' },
  { hash: '#/staff/statistics/visit-list?page=2', expected: 'staffStatisticsVisitList' },
  {
    hash: '#/staff/users/7/edit',
    expected: 'staffUserEdit',
    description: 'resolves /staff/users/:id/edit to staffUserEdit, not staffUser',
  },
  {
    hash: '#/staff/users/7',
    expected: 'staffUser',
    description: 'still resolves /staff/users/:id to staffUser',
  },
];

describe('HashRouteResolver', function() {
  runCases(CASES);
});
