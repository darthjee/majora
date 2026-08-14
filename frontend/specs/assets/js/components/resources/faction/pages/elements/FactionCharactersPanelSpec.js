import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import FactionCharactersPanel
  from '../../../../../../../../assets/js/components/resources/faction/pages/elements/FactionCharactersPanel.jsx';
import FactionCharactersPanelHelper
  from '../../../../../../../../assets/js/components/resources/faction/pages/elements/helpers/FactionCharactersPanelHelper.jsx';
import FactionCharactersPanelController
  from '../../../../../../../../assets/js/components/resources/faction/pages/elements/controllers/FactionCharactersPanelController.js';

describe('FactionCharactersPanel', function() {
  // eslint-disable-next-line no-empty-function
  const neverResolves = () => () => {};

  it('renders through FactionCharactersPanelHelper with the initial loading state', function() {
    spyOn(FactionCharactersPanelController.prototype, 'buildEffect').and.returnValue(neverResolves());
    let capturedState;
    let capturedGameSlug;
    let capturedFactionId;
    let capturedKickState;
    spyOn(FactionCharactersPanelHelper, 'render').and.callFake((state, gameSlug, factionId, kickState) => {
      capturedState = state;
      capturedGameSlug = gameSlug;
      capturedFactionId = factionId;
      capturedKickState = kickState;
      return React.createElement('div', null, 'panel');
    });

    renderToStaticMarkup(
      React.createElement(FactionCharactersPanel, {
        game_slug: 'demo', id: 9, name: 'The Silver Hand', refreshToken: 0,
      }),
    );

    expect(capturedState.items).toEqual([]);
    expect(capturedState.loading).toBe(true);
    expect(capturedGameSlug).toBe('demo');
    expect(capturedFactionId).toBe(9);
    expect(capturedKickState.target).toBeNull();
    expect(capturedKickState.factionName).toBe('The Silver Hand');
    expect(capturedKickState.submitting).toBe(false);
    expect(capturedKickState.error).toBe('');
  });

  it('does not throw when refreshToken changes', function() {
    spyOn(FactionCharactersPanelController.prototype, 'buildEffect').and.returnValue(neverResolves());
    spyOn(FactionCharactersPanelHelper, 'render').and.returnValue(null);

    expect(() => renderToStaticMarkup(
      React.createElement(FactionCharactersPanel, { game_slug: 'demo', id: 9, refreshToken: 3 }),
    )).not.toThrow();
  });

  it('passes an onKick handler that sets the kick target', function() {
    spyOn(FactionCharactersPanelController.prototype, 'buildEffect').and.returnValue(neverResolves());
    let capturedKickHandlers;
    spyOn(FactionCharactersPanelHelper, 'render').and.callFake((state, gameSlug, factionId, kickState, kickHandlers) => {
      capturedKickHandlers = kickHandlers;
      return React.createElement('div', null, 'panel');
    });

    renderToStaticMarkup(
      React.createElement(FactionCharactersPanel, { game_slug: 'demo', id: 9 }),
    );

    expect(typeof capturedKickHandlers.onKick).toBe('function');
    expect(typeof capturedKickHandlers.onConfirm).toBe('function');
    expect(typeof capturedKickHandlers.onCancel).toBe('function');
  });
});
