import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameSessionNew from '../../../../../assets/js/components/pages/GameSessionNew.jsx';
import GameSessionNewController from '../../../../../assets/js/components/pages/controllers/GameSessionNewController.js';
import Noop from '../../../../../assets/js/utils/Noop.js';

describe('GameSessionNew', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/sessions/new' } };
    spyOn(GameSessionNewController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the session creation form', function() {
    const html = renderToStaticMarkup(React.createElement(GameSessionNew));

    expect(html).toContain('id="game-session-new-title"');
    expect(html).toContain('id="game-session-new-date"');
  });

  it('renders the submit button', function() {
    const html = renderToStaticMarkup(React.createElement(GameSessionNew));

    expect(html).toContain('type="submit"');
  });
});
