import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameNpcNew from '../../../../../assets/js/components/pages/GameNpcNew.jsx';
import GameNpcNewController from '../../../../../assets/js/components/pages/controllers/GameNpcNewController.js';
import { stubBuildEffect } from '../../../../support/controllerStubs.js';

describe('GameNpcNew', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/npcs/new' } };
    stubBuildEffect(GameNpcNewController);
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the NPC creation form', function() {
    const html = renderToStaticMarkup(React.createElement(GameNpcNew));

    expect(html).toContain('id="game-npc-new-name"');
    expect(html).toContain('id="game-npc-new-role"');
    expect(html).toContain('id="game-npc-new-description"');
    expect(html).toContain('id="game-npc-new-private-description"');
    expect(html).toContain('id="game-npc-new-money"');
    expect(html).toContain('id="game-npc-new-hidden"');
    expect(html).toContain('id="game-npc-new-allegiance"');
    expect(html).toContain('id="game-npc-new-public-allegiance"');
  });

  it('renders the submit button', function() {
    const html = renderToStaticMarkup(React.createElement(GameNpcNew));

    expect(html).toContain('type="submit"');
  });
});
