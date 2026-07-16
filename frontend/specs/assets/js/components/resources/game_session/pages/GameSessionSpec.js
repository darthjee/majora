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

  describe('wiring into GameSessionController for poll submission', function() {
    // handleCreatePoll is defined after the loading gate, so it never runs
    // under renderToStaticMarkup (useEffect never fires during SSR, so
    // `loading` stays true). As with the SessionMessagesController wiring
    // test above, we instead capture the real, fully-wired GameSessionController
    // instance GameSession constructs and exercise `submitPoll` on it
    // directly, proving GameSession wires a working controller (real
    // sessionClient included) for the poll submit handler to call.
    const fields = ['setSession', 'setLoading', 'setError', 'sessionClient'];
    let capture;

    afterEach(function() {
      capture.restore();
    });

    it('redirects to the new poll on a successful submission', async function() {
      stubBuildEffect(GameSessionController);
      capture = captureConstructorFields(GameSessionController, fields);

      renderToStaticMarkup(React.createElement(GameSession));

      const instance = capture.getInstance();
      spyOn(instance.sessionClient, 'createSessionPoll').and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ id: 9 }),
      }));
      const setPollStatus = jasmine.createSpy('setPollStatus');
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await instance.submitPoll('demo', 7, ['2024-01-01'], { setPollStatus });

        expect(instance.sessionClient.createSessionPoll).toHaveBeenCalledWith(
          'demo', 7, null, ['2024-01-01'],
        );
        expect(fakeWindow.location.hash).toBe('/games/demo/polls/9');
      } finally {
        delete globalThis.window;
      }
    });

    it('marks the poll submission as failed on a non-201 response', async function() {
      stubBuildEffect(GameSessionController);
      capture = captureConstructorFields(GameSessionController, fields);

      renderToStaticMarkup(React.createElement(GameSession));

      const instance = capture.getInstance();
      spyOn(instance.sessionClient, 'createSessionPoll').and.returnValue(Promise.resolve({
        status: 403,
        json: () => Promise.resolve({}),
      }));
      const setPollStatus = jasmine.createSpy('setPollStatus');

      await instance.submitPoll('demo', 7, ['2024-01-01'], { setPollStatus });

      expect(setPollStatus).toHaveBeenCalledWith('error');
    });
  });
});
