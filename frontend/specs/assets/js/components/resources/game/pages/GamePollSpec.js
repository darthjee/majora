import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GamePoll from '../../../../../../../assets/js/components/resources/game/pages/GamePoll.jsx';
import GamePollHelper from '../../../../../../../assets/js/components/resources/game/pages/helpers/GamePollHelper.jsx';
import GamePollController from '../../../../../../../assets/js/components/resources/game/pages/controllers/GamePollController.js';
import {
  stubBuildEffect, stubRenderLoading, captureConstructorFields,
} from '../../../../../../support/controllerStubs.js';

describe('GamePoll', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/polls/7' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while fetching', function() {
    stubBuildEffect(GamePollController);
    stubRenderLoading(GamePollHelper);

    const html = renderToStaticMarkup(React.createElement(GamePoll));

    expect(html).toContain('loading');
  });

  it('renders the poll detail via GamePollHelper.render', function() {
    const poll = {
      id: 7, title: 'Which tavern?', description: '', type: 'single', status: 'open', game_slug: 'demo', options: [],
    };
    const html = renderToStaticMarkup(GamePollHelper.render(poll));

    expect(html).toContain('Which tavern?');
  });

  describe('wiring into GamePollController', function() {
    const fields = ['setCanVote', 'setCanClose', 'setSelectedOptionIds'];
    let capture;

    afterEach(function() {
      capture.restore();
    });

    it('threads real React state setters into the matching constructor slots', function() {
      stubBuildEffect(GamePollController);
      capture = captureConstructorFields(GamePollController, fields);

      renderToStaticMarkup(React.createElement(GamePoll));

      expect(typeof capture.spies.setCanVote).toBe('function');
      expect(typeof capture.spies.setCanClose).toBe('function');
      expect(typeof capture.spies.setSelectedOptionIds).toBe('function');
    });
  });
});
