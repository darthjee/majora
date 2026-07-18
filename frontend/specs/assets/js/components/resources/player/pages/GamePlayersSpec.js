import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GamePlayers from '../../../../../../../assets/js/components/resources/player/pages/GamePlayers.jsx';
import GamePlayersHelper from '../../../../../../../assets/js/components/resources/player/pages/helpers/GamePlayersHelper.jsx';

describe('GamePlayers', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/players' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('delegates rendering to GamePlayersHelper.render with the game slug from the hash', function() {
    const renderSpy = spyOn(GamePlayersHelper, 'render').and.callThrough();

    renderToStaticMarkup(React.createElement(GamePlayers));

    expect(renderSpy).toHaveBeenCalledWith('demo');
  });
});
