import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameTreasures from '../../../../../../../assets/js/components/resources/treasure/pages/GameTreasures.jsx';
import GameTreasuresHelper from '../../../../../../../assets/js/components/resources/treasure/pages/helpers/GameTreasuresHelper.jsx';

describe('GameTreasures', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/treasures' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  const renderPage = () => {
    let capturedState;
    let capturedHandlers;

    spyOn(GameTreasuresHelper, 'render').and.callFake((state, handlers) => {
      capturedState = state;
      capturedHandlers = handlers;
      return React.createElement('div', null, 'page');
    });

    renderToStaticMarkup(React.createElement(GameTreasures));

    return { state: capturedState, handlers: capturedHandlers };
  };

  it('resolves the game slug from the hash', function() {
    const { state } = renderPage();

    expect(state.gameSlug).toBe('demo');
    expect(state.basePath).toBe('#/games/demo/treasures');
    expect(state.backHref).toBe('#/games/demo');
    expect(state.newHref).toBe('#/games/demo/treasures/new');
  });

  it('passes the default state to the helper', function() {
    const { state } = renderPage();

    expect(state.canEdit).toBe(false);
    expect(state.showUploadModal).toBe(false);
    expect(state.showAddModal).toBe(false);
    expect(state.selectedTreasure).toBeNull();
    expect(state.refreshToken).toBe(0);
    expect(state.activeFilters).toEqual({});
  });

  it('exposes an onCanEditChange handler wired to a setter', function() {
    const { handlers } = renderPage();

    expect(() => handlers.onCanEditChange(true)).not.toThrow();
  });

  it('exposes an onUploadClick handler', function() {
    const { handlers } = renderPage();

    expect(() => handlers.onUploadClick({ id: 1 })).not.toThrow();
  });

  it('exposes onUploadClose/onUploadSuccess handlers', function() {
    const { handlers } = renderPage();

    expect(() => handlers.onUploadClose()).not.toThrow();
    expect(() => handlers.onUploadSuccess()).not.toThrow();
  });

  it('exposes onAddClick/onAddClose/onAddSuccess handlers', function() {
    const { handlers } = renderPage();

    expect(() => handlers.onAddClick()).not.toThrow();
    expect(() => handlers.onAddClose()).not.toThrow();
    expect(() => handlers.onAddSuccess()).not.toThrow();
  });

  it('updates the hash and resets pagination to page 1 on filter query', function() {
    const { handlers } = renderPage();

    handlers.onFilterQuery({ name: 'sword' });

    expect(window.location.hash).toBe('#/games/demo/treasures?page=1&name=sword');
  });

  it('resets the hash to the base path on filter clear', function() {
    window.location.hash = '#/games/demo/treasures?name=sword';
    const { handlers } = renderPage();

    handlers.onFilterClear();

    expect(window.location.hash).toBe('#/games/demo/treasures');
  });
});
