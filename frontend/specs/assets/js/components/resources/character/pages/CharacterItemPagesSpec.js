import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterItem from '../../../../../../../assets/js/components/resources/character/pages/PcCharacterItem.jsx';
import NpcCharacterItem
  from '../../../../../../../assets/js/components/resources/character/pages/NpcCharacterItem.jsx';
import CharacterItemDetailController
  from '../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterItemDetailController.js';
import { stubBuildEffect, captureConstructorFields } from '../../../../../../support/controllerStubs.js';

const KINDS = [
  {
    label: 'PcCharacterItem', Component: PcCharacterItem, kind: 'pcs', hash: '#/games/demo/pcs/7/items/1',
  },
  {
    label: 'NpcCharacterItem', Component: NpcCharacterItem, kind: 'npcs', hash: '#/games/demo/npcs/9/items/1',
  },
];

KINDS.forEach(({
  label, Component, kind, hash,
}) => {
  describe(label, function() {
    let originalWindow;
    let capture;

    beforeEach(function() {
      originalWindow = globalThis.window;
      globalThis.window = { location: { hash } };
    });

    afterEach(function() {
      globalThis.window = originalWindow;
      capture.restore();
    });

    it(`wires the shared CharacterItem component with characterKind "${kind}"`, function() {
      stubBuildEffect(CharacterItemDetailController);
      capture = captureConstructorFields(CharacterItemDetailController, ['characterKind']);

      renderToStaticMarkup(React.createElement(Component));

      expect(capture.spies.characterKind).toBe(kind);
    });
  });
});
