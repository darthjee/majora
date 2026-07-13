import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacter from '../../../../../../../assets/js/components/resources/character/pages/PcCharacter.jsx';
import NpcCharacter from '../../../../../../../assets/js/components/resources/character/pages/NpcCharacter.jsx';
import CharacterHelper from '../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx';
import PcCharacterController from '../../../../../../../assets/js/components/resources/character/pages/controllers/PcCharacterController.js';
import NpcCharacterController from '../../../../../../../assets/js/components/resources/character/pages/controllers/NpcCharacterController.js';
import { buildCharacter } from '../../../../../../support/factories.js';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';

const KINDS = [
  {
    label: 'PcCharacter',
    Component: PcCharacter,
    Controller: PcCharacterController,
    characterKind: 'pcs',
    name: 'Aragorn',
    isPc: true,
  },
  {
    label: 'NpcCharacter',
    Component: NpcCharacter,
    Controller: NpcCharacterController,
    characterKind: 'npcs',
    name: 'Goblin King',
    isPc: false,
  },
];

KINDS.forEach(({ label, Component, Controller, characterKind, name, isPc }) => {
  describe(label, function() {
    it('renders the loading state while fetching', function() {
      stubBuildEffect(Controller);
      stubRenderLoading(CharacterHelper);

      const html = renderToStaticMarkup(React.createElement(Component));

      expect(html).toContain('loading');
    });

    it('renders an edit button via CharacterHelper.render when the character can be edited', function() {
      stubBuildEffect(Controller);

      const character = buildCharacter({
        id: 7, name, game_slug: 'demo', can_edit: true, is_pc: isPc,
      });
      const html = renderToStaticMarkup(CharacterHelper.render(character, `#/games/demo/${characterKind}`));

      expect(html).toContain(`href="#/games/demo/${characterKind}/7/edit"`);
    });
  });
});
