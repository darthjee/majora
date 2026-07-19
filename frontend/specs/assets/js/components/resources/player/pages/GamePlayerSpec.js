import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GamePlayer from '../../../../../../../assets/js/components/resources/player/pages/GamePlayer.jsx';

describe('GamePlayer', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/players/7' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the shared PlayerDetail component (its initial loading state)', function() {
    const html = renderToStaticMarkup(React.createElement(GamePlayer));

    expect(html).toContain('Loading player...');
  });
});
