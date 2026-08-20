import { runCases } from './support.js';

const CASES = [
  {
    hash: '#/stl_models',
    expected: 'home',
    description: 'no longer resolves the old top-level /stl_models to stlModels',
  },
  {
    hash: '#/stl_models/new',
    expected: 'home',
    description: 'no longer resolves /stl_models/new (the "new" page/route was dropped)',
  },
  {
    hash: '#/other',
    expected: 'home',
    description: 'falls back to home for unknown routes',
  },
];

describe('HashRouteResolver', function() {
  runCases(CASES);
});
