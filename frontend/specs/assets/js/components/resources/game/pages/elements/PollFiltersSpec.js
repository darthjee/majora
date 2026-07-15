import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PollFilters
  from '../../../../../../../../assets/js/components/resources/game/pages/elements/PollFilters.jsx';
import PollFiltersHelper
  from '../../../../../../../../assets/js/components/resources/game/pages/elements/helpers/PollFiltersHelper.jsx';

describe('PollFilters', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  const captureHandlers = () => {
    let captured;
    spyOn(PollFiltersHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return React.createElement('div', null, 'filters');
    });
    return () => captured;
  };

  it('renders a blank draft status when the hash has no filter params', function() {
    globalThis.window = { location: { hash: '#/games/demo/polls' } };
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(PollFilters, { onQuery: jasmine.createSpy(), onClear: jasmine.createSpy() }),
    );

    expect(getCaptured().state).toEqual({ status: '' });
  });

  it('pre-populates the draft status from the hash query param (deep link)', function() {
    globalThis.window = { location: { hash: '#/games/demo/polls?status=open' } };
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(PollFilters, { onQuery: jasmine.createSpy(), onClear: jasmine.createSpy() }),
    );

    expect(getCaptured().state).toEqual({ status: 'open' });
  });

  it('calls onQuery with the built query when the Query handler runs', function() {
    globalThis.window = { location: { hash: '#/games/demo/polls?status=open' } };
    const onQuery = jasmine.createSpy('onQuery');
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(PollFilters, { onQuery, onClear: jasmine.createSpy() }),
    );
    getCaptured().handlers.onQuery();

    expect(onQuery).toHaveBeenCalledWith({ status: 'open' });
  });

  it('calls onClear when the Clear handler runs', function() {
    globalThis.window = { location: { hash: '#/games/demo/polls?status=open' } };
    const onClear = jasmine.createSpy('onClear');
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(PollFilters, { onQuery: jasmine.createSpy(), onClear }),
    );
    getCaptured().handlers.onClear();

    expect(onClear).toHaveBeenCalled();
  });
});
