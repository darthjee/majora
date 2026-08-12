import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameFactions from '../../../../../../../assets/js/components/resources/faction/pages/GameFactions.jsx';
import GameFactionsHelper
  from '../../../../../../../assets/js/components/resources/faction/pages/helpers/GameFactionsHelper.jsx';
import GameFactionsController
  from '../../../../../../../assets/js/components/resources/faction/pages/controllers/GameFactionsController.js';
import FactionNewModalHelper
  from '../../../../../../../assets/js/components/resources/faction/pages/elements/helpers/FactionNewModalHelper.jsx';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

describe('GameFactions', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/factions' } };
    stubBuildEffect(GameFactionsController);
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('resolves the game slug from the hash and delegates to GameFactionsHelper', function() {
    let capturedState;
    spyOn(GameFactionsHelper, 'render').and.callFake((state) => {
      capturedState = state;
      return React.createElement('div', null, 'page');
    });

    renderToStaticMarkup(React.createElement(GameFactions));

    expect(capturedState.gameSlug).toBe('demo');
    expect(capturedState.basePath).toBe('#/games/demo/factions');
    expect(capturedState.backHref).toBe('#/games/demo');
    expect(capturedState.canCreateFaction).toBe(false);
    expect(capturedState.refreshToken).toBe(0);
  });

  it('renders the New Faction modal initially closed', function() {
    let capturedShow;
    spyOn(GameFactionsHelper, 'render').and.returnValue(null);
    spyOn(FactionNewModalHelper, 'render').and.callFake((show) => {
      capturedShow = show;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameFactions));

    expect(capturedShow).toBe(false);
  });

  it('opens the new-faction modal via the onNewClick handler without throwing', function() {
    let capturedHandlers;
    spyOn(GameFactionsHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameFactions));

    expect(() => capturedHandlers.onNewClick()).not.toThrow();
  });

  it('closes the new-faction modal without throwing', function() {
    let capturedModalHandlers;
    spyOn(GameFactionsHelper, 'render').and.returnValue(null);
    spyOn(FactionNewModalHelper, 'render').and.callFake((show, formState, handlers) => {
      capturedModalHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameFactions));

    expect(() => capturedModalHandlers.onClose()).not.toThrow();
  });
});
