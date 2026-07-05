import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameTreasures from '../../../../../assets/js/components/pages/GameTreasures.jsx';
import GameTreasuresHelper from '../../../../../assets/js/components/pages/helpers/GameTreasuresHelper.jsx';
import GameTreasuresController from '../../../../../assets/js/components/pages/controllers/GameTreasuresController.js';
import Noop from '../../../../../assets/js/utils/Noop.js';

describe('GameTreasures', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/treasures' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while fetching', function() {
    spyOn(GameTreasuresController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);
    spyOn(GameTreasuresHelper, 'renderLoading').and.returnValue(React.createElement('div', null, 'loading'));

    const html = renderToStaticMarkup(React.createElement(GameTreasures));

    expect(html).toContain('loading');
  });

  it('renders an upload button per treasure via GameTreasuresHelper.render when isSuperUser is true', function() {
    spyOn(GameTreasuresController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);

    const treasures = [{ id: 1, name: 'Golden Crown', value: 500 }];
    const pagination = { page: 1, pages: 1, perPage: 10 };
    const html = renderToStaticMarkup(
      GameTreasuresHelper.render(treasures, pagination, '#/games/demo/treasures', '#/games/demo', true, Noop.noop)
    );

    expect(html).toContain('photo-upload-overlay-button');
  });
});
