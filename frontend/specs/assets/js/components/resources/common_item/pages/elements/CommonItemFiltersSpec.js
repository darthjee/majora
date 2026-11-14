import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CommonItemFilters from '../../../../../../../../assets/js/components/resources/common_item/pages/elements/CommonItemFilters.jsx';
import CommonItemFiltersHelper from '../../../../../../../../assets/js/components/resources/common_item/pages/elements/helpers/CommonItemFiltersHelper.jsx';

describe('CommonItemFilters', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  const captureHandlers = () => {
    let captured;
    spyOn(CommonItemFiltersHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return React.createElement('div', null, 'filters');
    });
    return () => captured;
  };

  const renderFilters = (onQuery = jasmine.createSpy(), onClear = jasmine.createSpy()) => {
    const getCaptured = captureHandlers();
    renderToStaticMarkup(React.createElement(CommonItemFilters, { onQuery, onClear }));
    return getCaptured();
  };

  it('renders blank draft fields when the hash has no filter params', function() {
    globalThis.window = { location: { hash: '#/games/demo/common_items' } };

    expect(renderFilters().state).toEqual({
      name: '', category: '', minPrice: '', maxPrice: '',
    });
  });

  it('pre-populates draft fields from the hash query params', function() {
    globalThis.window = {
      location: { hash: '#/games/demo/common_items?name=rope&category=tool&min_price=1&max_price=9' },
    };

    expect(renderFilters().state).toEqual({
      name: 'rope', category: 'tool', minPrice: '1', maxPrice: '9',
    });
  });

  it('calls onQuery once with the built query', function() {
    globalThis.window = {
      location: { hash: '#/games/demo/common_items?name=rope&category=tool&min_price=0&max_price=9' },
    };
    const onQuery = jasmine.createSpy('onQuery');

    renderFilters(onQuery).handlers.onQuery();

    expect(onQuery).toHaveBeenCalledOnceWith({
      name: 'rope', category: 'tool', min_price: '0', max_price: '9',
    });
  });

  it('calls onClear when the Clear handler runs', function() {
    globalThis.window = { location: { hash: '#/games/demo/common_items?name=rope' } };
    const onClear = jasmine.createSpy('onClear');

    renderFilters(jasmine.createSpy(), onClear).handlers.onClear();

    expect(onClear).toHaveBeenCalled();
  });

  it('exposes change handlers for every field', function() {
    globalThis.window = { location: { hash: '#/games/demo/common_items' } };
    const { handlers } = renderFilters();

    expect(() => {
      handlers.onNameChange('a');
      handlers.onCategoryChange('tool');
      handlers.onMinPriceChange('1');
      handlers.onMaxPriceChange('2');
    }).not.toThrow();
  });
});
