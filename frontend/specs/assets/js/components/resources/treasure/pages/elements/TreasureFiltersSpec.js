import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TreasureFilters from '../../../../../../../../assets/js/components/resources/treasure/pages/elements/TreasureFilters.jsx';
import TreasureFiltersHelper from '../../../../../../../../assets/js/components/resources/treasure/pages/elements/helpers/TreasureFiltersHelper.jsx';

describe('TreasureFilters', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  const captureHandlers = () => {
    let captured;
    spyOn(TreasureFiltersHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return React.createElement('div', null, 'filters');
    });
    return () => captured;
  };

  it('renders blank draft fields when the hash has no filter params', function() {
    globalThis.window = { location: { hash: '#/treasures' } };
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(TreasureFilters, { onQuery: jasmine.createSpy(), onClear: jasmine.createSpy() })
    );

    expect(getCaptured().state).toEqual({
      gameType: '', minValue: '', maxValue: '', name: '',
    });
  });

  it('pre-populates draft fields from the hash query params (deep link)', function() {
    globalThis.window = {
      location: { hash: '#/treasures?game_type=dnd&min_value=10&max_value=100&name=sword' },
    };
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(TreasureFilters, { onQuery: jasmine.createSpy(), onClear: jasmine.createSpy() })
    );

    expect(getCaptured().state).toEqual({
      gameType: 'dnd', minValue: '10', maxValue: '100', name: 'sword',
    });
  });

  it('calls onQuery with the built query when the Query handler runs', function() {
    globalThis.window = {
      location: { hash: '#/treasures?game_type=dnd&min_value=10&max_value=100&name=sword' },
    };
    const onQuery = jasmine.createSpy('onQuery');
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(TreasureFilters, { onQuery, onClear: jasmine.createSpy() })
    );
    getCaptured().handlers.onQuery();

    expect(onQuery).toHaveBeenCalledWith({
      game_type: 'dnd', min_value: '10', max_value: '100', name: 'sword',
    });
  });

  it('calls onClear when the Clear handler runs', function() {
    globalThis.window = { location: { hash: '#/treasures?game_type=dnd&name=sword' } };
    const onClear = jasmine.createSpy('onClear');
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(TreasureFilters, { onQuery: jasmine.createSpy(), onClear })
    );
    getCaptured().handlers.onClear();

    expect(onClear).toHaveBeenCalled();
  });

  it('passes showGameType through to TreasureFiltersHelper.render, defaulting to true', function() {
    globalThis.window = { location: { hash: '#/treasures' } };
    let showGameType;
    spyOn(TreasureFiltersHelper, 'render').and.callFake((_state, _handlers, passedShowGameType) => {
      showGameType = passedShowGameType;
      return React.createElement('div', null, 'filters');
    });

    renderToStaticMarkup(
      React.createElement(TreasureFilters, { onQuery: jasmine.createSpy(), onClear: jasmine.createSpy() })
    );

    expect(showGameType).toBe(true);
  });

  it('passes showGameType={false} through to TreasureFiltersHelper.render when set', function() {
    globalThis.window = { location: { hash: '#/games/demo/treasures' } };
    let showGameType;
    spyOn(TreasureFiltersHelper, 'render').and.callFake((_state, _handlers, passedShowGameType) => {
      showGameType = passedShowGameType;
      return React.createElement('div', null, 'filters');
    });

    renderToStaticMarkup(
      React.createElement(
        TreasureFilters, { onQuery: jasmine.createSpy(), onClear: jasmine.createSpy(), showGameType: false },
      )
    );

    expect(showGameType).toBe(false);
  });
});
