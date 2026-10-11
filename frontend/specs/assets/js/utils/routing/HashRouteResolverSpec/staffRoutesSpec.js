import { runCases } from './support.js';

const CASES = [
  { hash: '#/staff/users', expected: 'staffUsers' },
  { hash: '#/staff/photos', expected: 'staffPhotos' },
  { hash: '#/staff/copies', expected: 'staffCopies' },
  { hash: '#/staff/copies?from=a&to=b&type=items', expected: 'staffCopies' },
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
