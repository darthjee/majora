import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Game from '../../../../../../../assets/js/components/resources/game/pages/Game.jsx';
import GameHelper from '../../../../../../../assets/js/components/resources/game/pages/helpers/GameHelper.jsx';
import GameController from '../../../../../../../assets/js/components/resources/game/pages/controllers/GameController.js';
import FacadeRefresh from '../../../../../../../assets/js/utils/access/useFacadeRefresh.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

describe('Game', function() {
  it('renders the loading state while fetching', function() {
    spyOn(GameController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);
    spyOn(GameHelper, 'renderLoading').and.returnValue(React.createElement('div', null, 'loading'));

    const html = renderToStaticMarkup(React.createElement(Game));

    expect(html).toContain('loading');
  });

  it('wires FacadeRefresh.useFacadeRefresh with the page controller', function() {
    spyOn(GameController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);
    spyOn(FacadeRefresh, 'useFacadeRefresh');

    renderToStaticMarkup(React.createElement(Game));

    expect(FacadeRefresh.useFacadeRefresh).toHaveBeenCalledWith(jasmine.any(GameController));
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
