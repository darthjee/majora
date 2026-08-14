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
    spyOn(FactionCharactersPanelHelper, 'render').and.callFake((state, gameSlug, factionId) => {
      capturedState = state;
      capturedGameSlug = gameSlug;
      capturedFactionId = factionId;
      return React.createElement('div', null, 'panel');
    });

    renderToStaticMarkup(
      React.createElement(FactionCharactersPanel, { game_slug: 'demo', id: 9, refreshToken: 0 }),
    );

    expect(capturedState.items).toEqual([]);
    expect(capturedState.loading).toBe(true);
    expect(capturedGameSlug).toBe('demo');
    expect(capturedFactionId).toBe(9);
  });

  it('does not throw when refreshToken changes', function() {
    spyOn(FactionCharactersPanelController.prototype, 'buildEffect').and.returnValue(neverResolves());
    spyOn(FactionCharactersPanelHelper, 'render').and.returnValue(null);

    expect(() => renderToStaticMarkup(
      React.createElement(FactionCharactersPanel, { game_slug: 'demo', id: 9, refreshToken: 3 }),
    )).not.toThrow();
  });
});
