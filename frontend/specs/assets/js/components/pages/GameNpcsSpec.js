import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameNpcs from '../../../../../assets/js/components/pages/GameNpcs.jsx';
import GameCharactersHelper from '../../../../../assets/js/components/pages/helpers/GameCharactersHelper.jsx';
import GameNpcsController from '../../../../../assets/js/components/pages/controllers/GameNpcsController.js';
import Noop from '../../../../../assets/js/utils/Noop.js';

describe('GameNpcs', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/npcs' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while fetching', function() {
    spyOn(GameNpcsController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);
    spyOn(GameCharactersHelper, 'renderLoading').and.returnValue(React.createElement('div', null, 'loading'));

    const html = renderToStaticMarkup(React.createElement(GameNpcs));

    expect(html).toContain('loading');
  });

  it('renders the new NPC button via GameCharactersHelper.render when canEdit is true', function() {
    spyOn(GameNpcsController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);

    const html = renderToStaticMarkup(
      GameCharactersHelper.render(
        [], { page: 1, pages: 1, perPage: 10 }, '#/games/demo/npcs', 'demo',
        'Non-Player Characters', 'npc', '#/games/demo', true, '#/games/demo/npcs/new',
      ),
    );

    expect(html).toContain('New NPC');
    expect(html).toContain('href="#/games/demo/npcs/new"');
  });
});
