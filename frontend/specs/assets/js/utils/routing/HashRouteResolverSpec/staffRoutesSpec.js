import { runCases } from './support.js';

const CASES = [
  { hash: '#/staff/users', expected: 'staffUsers' },
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
