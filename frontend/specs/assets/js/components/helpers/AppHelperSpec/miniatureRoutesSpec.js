import Translator from '../../../../../../assets/js/i18n/Translator.js';
import { runCases } from './support.js';

const CASES = [
  { page: 'stlModels', hash: '#/miniatures/stl_models', expected: () => Translator.t('stl_models_page.loading') },
  { page: 'stlModel', hash: '#/miniatures/stl_models/1', expected: () => Translator.t('stl_model_page.loading') },
  { page: 'sources', hash: '#/miniatures/sources', expected: () => Translator.t('sources_page.loading') },
  { page: 'source', hash: '#/miniatures/sources/1', expected: () => Translator.t('source_page.loading') },
  { page: 'collections', hash: '#/miniatures/collections', expected: () => Translator.t('collections_page.loading') },
  { page: 'collection', hash: '#/miniatures/collections/1', expected: () => Translator.t('collection_page.loading') },
];

describe('AppHelper', function() {
  runCases(CASES);
});
