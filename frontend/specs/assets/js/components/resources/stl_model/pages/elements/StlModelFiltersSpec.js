import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StlModelFilters from '../../../../../../../../assets/js/components/resources/stl_model/pages/elements/StlModelFilters.jsx';
import StlModelFiltersHelper from '../../../../../../../../assets/js/components/resources/stl_model/pages/elements/helpers/StlModelFiltersHelper.jsx';
import StlModelFiltersController from '../../../../../../../../assets/js/components/resources/stl_model/pages/elements/controllers/StlModelFiltersController.js';

describe('StlModelFilters', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    spyOn(StlModelFiltersController, 'loadResourcePicks').and.returnValue(Promise.resolve());
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  const captureHandlers = () => {
    let captured;
    spyOn(StlModelFiltersHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return React.createElement('div', null, 'filters');
    });
    return () => captured;
  };

  it('renders blank/empty draft fields when the hash has no filter params', function() {
    globalThis.window = { location: { hash: '#/miniatures/stl_models' } };
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(StlModelFilters, { onQuery: jasmine.createSpy(), onClear: jasmine.createSpy() })
    );

    expect(getCaptured().state).toEqual({
      name: '', type: '', size: '', races: [], roles: [], sources: [], collections: [], tags: [], tagInput: '',
    });
  });

  it('pre-populates scalar draft fields from the hash query params (deep link)', function() {
    globalThis.window = {
      location: { hash: '#/miniatures/stl_models?name=gob&type=creature&size=small' },
    };
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(StlModelFilters, { onQuery: jasmine.createSpy(), onClear: jasmine.createSpy() })
    );

    expect(getCaptured().state.name).toBe('gob');
    expect(getCaptured().state.type).toBe('creature');
    expect(getCaptured().state.size).toBe('small');
  });

  it('pre-populates the races/roles pickers from the hash, translating each value', function() {
    globalThis.window = {
      location: { hash: '#/miniatures/stl_models?race=elf&race=orc&roles=fighter' },
    };
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(StlModelFilters, { onQuery: jasmine.createSpy(), onClear: jasmine.createSpy() })
    );

    expect(getCaptured().state.races).toEqual([
      { id: 'elf', name: jasmine.any(String) }, { id: 'orc', name: jasmine.any(String) },
    ]);
    expect(getCaptured().state.roles).toEqual([{ id: 'fighter', name: jasmine.any(String) }]);
  });

  it('pre-populates the tags list from the hash', function() {
    globalThis.window = { location: { hash: '#/miniatures/stl_models?tags=painted&tags=resin' } };
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(StlModelFilters, { onQuery: jasmine.createSpy(), onClear: jasmine.createSpy() })
    );

    expect(getCaptured().state.tags).toEqual(['painted', 'resin']);
  });

  it('starts sources/collections empty (resolved asynchronously by the mount effect)', function() {
    globalThis.window = { location: { hash: '#/miniatures/stl_models?source=1&collection=2' } };
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(StlModelFilters, { onQuery: jasmine.createSpy(), onClear: jasmine.createSpy() })
    );

    expect(getCaptured().state.sources).toEqual([]);
    expect(getCaptured().state.collections).toEqual([]);
  });

  it('calls onQuery with the built query when the Query handler runs', function() {
    globalThis.window = { location: { hash: '#/miniatures/stl_models?name=gob' } };
    const onQuery = jasmine.createSpy('onQuery');
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(StlModelFilters, { onQuery, onClear: jasmine.createSpy() })
    );
    getCaptured().handlers.onQuery();

    expect(onQuery).toHaveBeenCalledWith({ name: 'gob' });
  });

  it('calls onClear when the Clear handler runs', function() {
    globalThis.window = { location: { hash: '#/miniatures/stl_models?name=gob' } };
    const onClear = jasmine.createSpy('onClear');
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(StlModelFilters, { onQuery: jasmine.createSpy(), onClear })
    );
    getCaptured().handlers.onClear();

    expect(onClear).toHaveBeenCalled();
  });

  it('passes every expected field change handler through to StlModelFiltersHelper.render', function() {
    globalThis.window = { location: { hash: '#/miniatures/stl_models' } };
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(StlModelFilters, { onQuery: jasmine.createSpy(), onClear: jasmine.createSpy() })
    );
    const { handlers } = getCaptured();

    [
      'onNameChange', 'onTypeChange', 'onSizeChange', 'onRacesChange', 'onRolesChange',
      'onSourcesChange', 'onCollectionsChange', 'onTagInputChange', 'onAddTag', 'onRemoveTag',
      'onQuery', 'onClear',
    ].forEach((key) => expect(typeof handlers[key]).toBe('function'));
  });
});
