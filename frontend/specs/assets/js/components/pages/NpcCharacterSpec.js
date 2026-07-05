import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import NpcCharacter from '../../../../../assets/js/components/pages/NpcCharacter.jsx';
import CharacterHelper from '../../../../../assets/js/components/pages/helpers/CharacterHelper.jsx';
import NpcCharacterController from '../../../../../assets/js/components/pages/controllers/NpcCharacterController.js';
import Noop from '../../../../../assets/js/utils/Noop.js';

describe('NpcCharacter', function() {
  it('renders the loading state while fetching', function() {
    spyOn(NpcCharacterController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);
    spyOn(CharacterHelper, 'renderLoading').and.returnValue(React.createElement('div', null, 'loading'));

    const html = renderToStaticMarkup(React.createElement(NpcCharacter));

    expect(html).toContain('loading');
  });

  it('renders an edit button via CharacterHelper.render when the character can be edited', function() {
    spyOn(NpcCharacterController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);

    const character = {
      id: 7,
      name: 'Goblin King',
      game_slug: 'demo',
      can_edit: true,
      is_pc: false,
      photos: [],
    };
    const html = renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/npcs'));

    expect(html).toContain('href="#/games/demo/npcs/7/edit"');
  });
});
