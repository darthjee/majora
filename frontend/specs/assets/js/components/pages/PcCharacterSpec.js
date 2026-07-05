import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacter from '../../../../../assets/js/components/pages/PcCharacter.jsx';
import CharacterHelper from '../../../../../assets/js/components/pages/helpers/CharacterHelper.jsx';
import PcCharacterController from '../../../../../assets/js/components/pages/controllers/PcCharacterController.js';
import Noop from '../../../../../assets/js/utils/Noop.js';

describe('PcCharacter', function() {
  it('renders the loading state while fetching', function() {
    spyOn(PcCharacterController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);
    spyOn(CharacterHelper, 'renderLoading').and.returnValue(React.createElement('div', null, 'loading'));

    const html = renderToStaticMarkup(React.createElement(PcCharacter));

    expect(html).toContain('loading');
  });

  it('renders an edit button via CharacterHelper.render when the character can be edited', function() {
    spyOn(PcCharacterController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);

    const character = {
      id: 7,
      name: 'Aragorn',
      game_slug: 'demo',
      can_edit: true,
      is_pc: true,
      photos: [],
    };
    const html = renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'));

    expect(html).toContain('href="#/games/demo/pcs/7/edit"');
  });
});
