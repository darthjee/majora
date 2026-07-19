import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PlayerDetail
  from '../../../../../../../../assets/js/components/resources/player/pages/shared/PlayerDetail.jsx';
import PlayerHelper
  from '../../../../../../../../assets/js/components/resources/player/pages/helpers/PlayerHelper.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

const loadedPlayer = { id: 7, character: { name: 'Frodo', photo_url: '/char.png' }, user: null };

/** Stub player controller that synchronously loads a player during construction. */
class LoadedController {
  constructor(setPlayer, setLoading) {
    setPlayer(loadedPlayer);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

/** Stub player controller that stays in the loading state. */
class LoadingController {
  buildEffect() { return () => Noop.noop; }
}

/** Stub player controller that synchronously sets an error during construction. */
class ErroredController {
  constructor(setPlayer, setLoading, setError) {
    setError('Unable to load player.');
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

/** Stub conversations controller that synchronously loads conversations during construction. */
class LoadedConversationsController {
  constructor(setConversations, setPagination, setLoading) {
    setConversations([{ id: 1, title: 'Session recap' }]);
    setPagination({ page: 1, pages: 1, perPage: 10 });
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

describe('PlayerDetail', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/players/7' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while the player is loading', function() {
    const html = renderToStaticMarkup(
      React.createElement(PlayerDetail, {
        ControllerClass: LoadingController,
        ConversationsControllerClass: LoadedConversationsController,
      })
    );

    expect(html).toContain('Loading player...');
  });

  it('renders the error state when the player fails to load', function() {
    const html = renderToStaticMarkup(
      React.createElement(PlayerDetail, {
        ControllerClass: ErroredController,
        ConversationsControllerClass: LoadedConversationsController,
      })
    );

    expect(html).toContain('Unable to load player.');
  });

  it('delegates to PlayerHelper.render with the player, back href, and conversations state', function() {
    let capturedPlayer;
    let capturedBackHref;
    let capturedConversationsState;
    spyOn(PlayerHelper, 'render').and.callFake((player, backHref, conversationsState) => {
      capturedPlayer = player;
      capturedBackHref = backHref;
      capturedConversationsState = conversationsState;
      return null;
    });

    renderToStaticMarkup(
      React.createElement(PlayerDetail, {
        ControllerClass: LoadedController,
        ConversationsControllerClass: LoadedConversationsController,
      })
    );

    expect(capturedPlayer).toEqual(loadedPlayer);
    expect(capturedBackHref).toBe('#/games/demo/players');
    expect(capturedConversationsState).toEqual({
      basePath: '#/games/demo/players/7',
      pageParam: 'conv_page',
      conversations: [{ id: 1, title: 'Session recap' }],
      pagination: { page: 1, pages: 1, perPage: 10 },
      loading: false,
      error: '',
    });
  });
});
