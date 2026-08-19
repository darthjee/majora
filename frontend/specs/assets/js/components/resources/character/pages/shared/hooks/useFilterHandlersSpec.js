import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import useFilterHandlers
  from '../../../../../../../../../assets/js/components/resources/character/pages/shared/hooks/useFilterHandlers.js';

/**
 * Minimal component exercising `useFilterHandlers`, capturing its return value for inspection.
 *
 * @param {object} props - Component props.
 * @param {string} props.basePath - Base path passed through to the hook.
 * @param {Function} props.refresh - Refresh spy passed through to the hook.
 * @param {Function} props.onResult - Called with the hook's return value.
 * @returns {React.ReactElement} A trivial element.
 */
function TestHost({ basePath, refresh, onResult }) {
  onResult(useFilterHandlers(basePath, refresh));
  return React.createElement('div', null, 'ok');
}

const render = (basePath, refresh) => {
  let captured;
  renderToStaticMarkup(
    React.createElement(TestHost, { basePath, refresh, onResult: (result) => { captured = result; } }),
  );
  return captured;
};

describe('useFilterHandlers', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('navigates to basePath with the built filter query hash and refreshes on onFilterQuery', function() {
    const refresh = jasmine.createSpy('refresh');
    const result = render('#/games/demo/npcs', refresh);

    result.onFilterQuery({ status: 'alive' });

    expect(globalThis.window.location.hash).toBe('#/games/demo/npcs?page=1&status=alive');
    expect(refresh).toHaveBeenCalled();
  });

  it('navigates back to the bare basePath and refreshes on onFilterClear', function() {
    const refresh = jasmine.createSpy('refresh');
    const result = render('#/games/demo/npcs', refresh);

    result.onFilterClear();

    expect(globalThis.window.location.hash).toBe('#/games/demo/npcs');
    expect(refresh).toHaveBeenCalled();
  });
});
