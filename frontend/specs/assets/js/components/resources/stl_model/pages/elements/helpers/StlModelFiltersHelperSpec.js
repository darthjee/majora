import { renderToStaticMarkup } from 'react-dom/server';
import StlModelFiltersHelper
  from '../../../../../../../../../assets/js/components/resources/stl_model/pages/elements/helpers/StlModelFiltersHelper.jsx';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('StlModelFiltersHelper', function() {
  describe('.render', function() {
    const handlers = {
      onNameChange: Noop.noop,
      onTypeChange: Noop.noop,
      onSizeChange: Noop.noop,
      onRacesChange: Noop.noop,
      onRolesChange: Noop.noop,
      onSourcesChange: Noop.noop,
      onCollectionsChange: Noop.noop,
      onTagInputChange: Noop.noop,
      onAddTag: Noop.noop,
      onRemoveTag: Noop.noop,
      onQuery: Noop.noop,
      onClear: Noop.noop,
    };
    const buildState = (overrides = {}) => ({
      name: '', type: '', size: '', races: [], roles: [], sources: [], collections: [], tags: [], tagInput: '',
      ...overrides,
    });

    it('renders the name input, type/size dropdowns, pickers, tags field, query and clear buttons', function() {
      const html = renderToStaticMarkup(StlModelFiltersHelper.render(buildState(), handlers));

      expect(html).toContain('data-testid="stl-model-filters"');
      expect(html).toContain('data-testid="stl-model-filter-name"');
      expect(html).toContain('id="stl-model-filter-type"');
      expect(html).toContain('id="stl-model-filter-size"');
      expect(html).toContain('data-testid="stl-model-filter-query"');
      expect(html).toContain('data-testid="stl-model-filter-clear"');
    });

    it('renders the current name draft value', function() {
      const html = renderToStaticMarkup(StlModelFiltersHelper.render(buildState({ name: 'gob' }), handlers));
      expect(html).toContain('value="gob"');
    });

    it('renders the picked races/roles as badges', function() {
      const html = renderToStaticMarkup(StlModelFiltersHelper.render(buildState({
        races: [{ id: 'elf', name: 'Elf' }],
        roles: [{ id: 'fighter', name: 'Fighter' }],
      }), handlers));

      expect(html).toContain('Elf');
      expect(html).toContain('Fighter');
    });

    it('renders the picked sources/collections as badges', function() {
      const html = renderToStaticMarkup(StlModelFiltersHelper.render(buildState({
        sources: [{ id: 1, name: 'MyMiniFactory' }],
        collections: [{ id: 2, name: 'Goblin Pack' }],
      }), handlers));

      expect(html).toContain('MyMiniFactory');
      expect(html).toContain('Goblin Pack');
    });

    it('renders the current tags as badges', function() {
      const html = renderToStaticMarkup(
        StlModelFiltersHelper.render(buildState({ tags: ['painted', 'resin'] }), handlers)
      );

      expect(html).toContain('painted');
      expect(html).toContain('resin');
    });
  });
});
