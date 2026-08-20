import { runCases } from './support.js';

const CASES = [
  {
    hash: '#/miniatures/collections/7',
    expected: 'collection',
    description: 'resolves /miniatures/collections/:id to collection, not collections',
  },
  {
    hash: '#/miniatures/collections',
    expected: 'collections',
    description: 'still resolves /miniatures/collections to collections',
  },
  {
    hash: '#/miniatures/sources/7',
    expected: 'source',
    description: 'resolves /miniatures/sources/:id to source, not sources',
  },
  {
    hash: '#/miniatures/sources',
    expected: 'sources',
    description: 'still resolves /miniatures/sources to sources',
  },
  {
    hash: '#/miniatures/stl_models/7',
    expected: 'stlModel',
    description: 'resolves /miniatures/stl_models/:id to stlModel, not stlModels',
  },
  {
    hash: '#/miniatures/stl_models',
    expected: 'stlModels',
    description: 'still resolves /miniatures/stl_models to stlModels',
  },
  {
    hash: '#/miniatures/stl_models/new',
    expected: 'stlModelNew',
    description: 'resolves /miniatures/stl_models/new to stlModelNew, not stlModel (issue #1069)',
  },
  {
    hash: '#/miniatures/stl_models/7/edit',
    expected: 'stlModelEdit',
    description: 'resolves /miniatures/stl_models/:id/edit to stlModelEdit, not stlModel',
  },
];

describe('HashRouteResolver', function() {
  runCases(CASES);
});
