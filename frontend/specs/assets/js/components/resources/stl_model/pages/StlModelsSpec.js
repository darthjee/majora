import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StlModels, { buildFilterQueryHash } from '../../../../../../../assets/js/components/resources/stl_model/pages/StlModels.jsx';
import StlModelsHelper from '../../../../../../../assets/js/components/resources/stl_model/pages/helpers/StlModelsHelper.jsx';

describe('StlModels', function() {
  const captureArgs = () => {
    let captured;
    spyOn(StlModelsHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return React.createElement('div', null, 'stl models');
    });
    return () => captured;
  };

  it('delegates rendering to StlModelsHelper.render with isStaffOrSuperUser false before resolving', function() {
    const getCaptured = captureArgs();

    renderToStaticMarkup(React.createElement(StlModels));

    expect(getCaptured().state.isStaffOrSuperUser).toBe(false);
  });

  it('starts with refreshToken 0', function() {
    const getCaptured = captureArgs();

    renderToStaticMarkup(React.createElement(StlModels));

    expect(getCaptured().state.refreshToken).toBe(0);
  });

  it('passes the current hash filter params as activeFilters', function() {
    const getCaptured = captureArgs();

    renderToStaticMarkup(React.createElement(StlModels));

    expect(getCaptured().state.activeFilters).toBeInstanceOf(URLSearchParams);
  });

  it('navigates and refreshes on filter query', function() {
    const originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/miniatures/stl_models' } };
    const getCaptured = captureArgs();

    renderToStaticMarkup(React.createElement(StlModels));
    getCaptured().handlers.onFilterQuery({ name: 'gob' });

    expect(globalThis.window.location.hash).toBe(buildFilterQueryHash({ name: 'gob' }));

    globalThis.window = originalWindow;
  });

  it('navigates back to the base path and refreshes on filter clear', function() {
    const originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/miniatures/stl_models?name=gob' } };
    const getCaptured = captureArgs();

    renderToStaticMarkup(React.createElement(StlModels));
    getCaptured().handlers.onFilterClear();

    expect(globalThis.window.location.hash).toBe('#/miniatures/stl_models');

    globalThis.window = originalWindow;
  });
});

describe('buildFilterQueryHash', function() {
  it('builds the STL models hash with the given filters, resetting pagination', function() {
    expect(buildFilterQueryHash({ name: 'gob', race: ['elf', 'orc'] }))
      .toBe('#/miniatures/stl_models?page=1&name=gob&race=elf&race=orc');
  });
});
