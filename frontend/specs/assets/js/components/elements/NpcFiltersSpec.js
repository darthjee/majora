import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import NpcFilters from '../../../../../assets/js/components/elements/NpcFilters.jsx';
import NpcFiltersHelper from '../../../../../assets/js/components/elements/helpers/NpcFiltersHelper.jsx';

describe('NpcFilters', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  const captureHandlers = () => {
    let captured;
    spyOn(NpcFiltersHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return React.createElement('div', null, 'filters');
    });
    return () => captured;
  };

  it('renders blank draft fields when the hash has no filter params', function() {
    globalThis.window = { location: { hash: '#/games/demo/npcs' } };
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(NpcFilters, { onQuery: jasmine.createSpy(), onClear: jasmine.createSpy() })
    );

    expect(getCaptured().state).toEqual({ status: '', name: '', allegiance: '' });
  });

  it('pre-populates draft fields from the hash query params (deep link)', function() {
    globalThis.window = { location: { hash: '#/games/demo/npcs?slain=true&name=gob&allegiance=ally' } };
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(NpcFilters, { onQuery: jasmine.createSpy(), onClear: jasmine.createSpy() })
    );

    expect(getCaptured().state).toEqual({ status: 'slain', name: 'gob', allegiance: 'ally' });
  });

  it('calls onQuery with the built query when the Query handler runs', function() {
    globalThis.window = { location: { hash: '#/games/demo/npcs?slain=true&name=gob&allegiance=ally' } };
    const onQuery = jasmine.createSpy('onQuery');
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(NpcFilters, { onQuery, onClear: jasmine.createSpy() })
    );
    getCaptured().handlers.onQuery();

    expect(onQuery).toHaveBeenCalledWith({ slain: 'true', name: 'gob', allegiance: 'ally' });
  });

  it('calls onClear when the Clear handler runs', function() {
    globalThis.window = { location: { hash: '#/games/demo/npcs?slain=true&name=gob' } };
    const onClear = jasmine.createSpy('onClear');
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(NpcFilters, { onQuery: jasmine.createSpy(), onClear })
    );
    getCaptured().handlers.onClear();

    expect(onClear).toHaveBeenCalled();
  });
});
