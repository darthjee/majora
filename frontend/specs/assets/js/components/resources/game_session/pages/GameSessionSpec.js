import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameSession from '../../../../../../../assets/js/components/resources/game_session/pages/GameSession.jsx';
import GameSessionController from '../../../../../../../assets/js/components/resources/game_session/pages/controllers/GameSessionController.js';
import SessionMessagesController from '../../../../../../../assets/js/components/resources/game_session/pages/controllers/SessionMessagesController.js';
import GameSessionHelper from '../../../../../../../assets/js/components/resources/game_session/pages/helpers/GameSessionHelper.jsx';
import { stubBuildEffect, stubRenderLoading, captureConstructorFields } from '../../../../../../support/controllerStubs.js';

describe('GameSession', function() {
  it('renders the loading state on initial render before the fetch resolves', function() {
    stubBuildEffect(GameSessionController);
    stubRenderLoading(GameSessionHelper);

    const html = renderToStaticMarkup(React.createElement(GameSession));

    expect(html).toContain('loading');
  });

  describe('wiring into SessionMessagesController', function() {
    const fields = ['setMessages', 'setNextEntryId', 'setLoadingMore'];
    let capture;

    afterEach(function() {
      capture.restore();
    });

    it('passes the real state setters into their matching constructor slots', async function() {
      stubBuildEffect(GameSessionController);
      const fetchSpy = spyOn(globalThis, 'fetch').and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 1, content: 'Hi', user: { name: 'Alice', avatar_url: null } }]),
        headers: { get: () => null },
      }));
      capture = captureConstructorFields(SessionMessagesController, fields);

      renderToStaticMarkup(React.createElement(GameSession));

      await capture.getInstance().loadFirstPage('demo', 7);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/sessions/7/messages.json', jasmine.anything());
      expect(capture.spies.setMessages).toHaveBeenCalledWith([
        { id: 1, content: 'Hi', user: { name: 'Alice', avatar_url: null } },
      ]);
      expect(capture.spies.setNextEntryId).toHaveBeenCalledWith(null);
    });
  });
});
