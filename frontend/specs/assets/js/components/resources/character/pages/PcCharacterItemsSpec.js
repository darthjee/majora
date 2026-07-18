import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterItems from '../../../../../../../assets/js/components/resources/character/pages/PcCharacterItems.jsx';
import CharacterItemsHelper from '../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterItemsHelper.jsx';

describe('PcCharacterItems', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/pcs/7/items' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('resolves the game slug/character id from the hash and delegates to CharacterItemsHelper', function() {
    spyOn(CharacterItemsHelper, 'render').and.callThrough();

    renderToStaticMarkup(React.createElement(PcCharacterItems));

    expect(CharacterItemsHelper.render).toHaveBeenCalledWith('pcs', 'pc-items', 'demo', '7');
  });
});
