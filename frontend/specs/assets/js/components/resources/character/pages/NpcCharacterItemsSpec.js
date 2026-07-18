import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import NpcCharacterItems from '../../../../../../../assets/js/components/resources/character/pages/NpcCharacterItems.jsx';
import CharacterItemsHelper from '../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterItemsHelper.jsx';

describe('NpcCharacterItems', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/npcs/9/items' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('resolves the game slug/character id from the hash and delegates to CharacterItemsHelper', function() {
    spyOn(CharacterItemsHelper, 'render').and.callThrough();

    renderToStaticMarkup(React.createElement(NpcCharacterItems));

    expect(CharacterItemsHelper.render).toHaveBeenCalledWith('npcs', 'npc-items', 'demo', '9');
  });
});
