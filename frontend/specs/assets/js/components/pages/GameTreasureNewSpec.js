import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameTreasureNew from '../../../../../assets/js/components/pages/GameTreasureNew.jsx';
import GameTreasureNewController from '../../../../../assets/js/components/pages/controllers/GameTreasureNewController.js';
import Noop from '../../../../../assets/js/utils/Noop.js';

describe('GameTreasureNew', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/treasures/new' } };
    spyOn(GameTreasureNewController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the treasure creation form', function() {
    const html = renderToStaticMarkup(React.createElement(GameTreasureNew));

    expect(html).toContain('id="game-treasure-new-name"');
    expect(html).toContain('id="game-treasure-new-value"');
  });

  it('renders the submit button', function() {
    const html = renderToStaticMarkup(React.createElement(GameTreasureNew));

    expect(html).toContain('type="submit"');
  });
});
