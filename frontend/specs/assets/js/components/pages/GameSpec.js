import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Game from '../../../../../assets/js/components/pages/Game.jsx';
import GameHelper from '../../../../../assets/js/components/pages/helpers/GameHelper.jsx';
import GameController from '../../../../../assets/js/components/pages/controllers/GameController.js';
import Noop from '../../../../../assets/js/utils/Noop.js';

describe('Game', function() {
  it('renders the loading state while fetching', function() {
    spyOn(GameController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);
    spyOn(GameHelper, 'renderLoading').and.returnValue(React.createElement('div', null, 'loading'));

    const html = renderToStaticMarkup(React.createElement(Game));

    expect(html).toContain('loading');
  });

  it('renders an edit button via GameHelper.render when the game can be edited', function() {
    spyOn(GameController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);

    const game = {
      name: 'Epic Quest',
      game_slug: 'epic-quest',
      can_edit: true,
    };
    const html = renderToStaticMarkup(GameHelper.render(game));

    expect(html).toContain('href="#/games/epic-quest/edit"');
  });
});
