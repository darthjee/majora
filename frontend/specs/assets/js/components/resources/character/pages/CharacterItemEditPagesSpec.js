import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterItemEdit
  from '../../../../../../../assets/js/components/resources/character/pages/PcCharacterItemEdit.jsx';
import NpcCharacterItemEdit
  from '../../../../../../../assets/js/components/resources/character/pages/NpcCharacterItemEdit.jsx';
import PcCharacterItemEditController
  from '../../../../../../../assets/js/components/resources/character/pages/controllers/PcCharacterItemEditController.js';
import NpcCharacterItemEditController
  from '../../../../../../../assets/js/components/resources/character/pages/controllers/NpcCharacterItemEditController.js';
import { stubBuildEffect, captureConstructorFields } from '../../../../../../support/controllerStubs.js';

const KINDS = [
  {
    label: 'PcCharacterItemEdit',
    Component: PcCharacterItemEdit,
    Controller: PcCharacterItemEditController,
    kind: 'pcs',
    hash: '#/games/demo/pcs/7/items/1/edit',
  },
  {
    label: 'NpcCharacterItemEdit',
    Component: NpcCharacterItemEdit,
    Controller: NpcCharacterItemEditController,
    kind: 'npcs',
    hash: '#/games/demo/npcs/9/items/1/edit',
  },
];

KINDS.forEach(({
  label, Component, Controller, kind, hash,
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

    it(`wires the shared CharacterItemEdit component with characterKind "${kind}"`, function() {
      stubBuildEffect(Controller);
      capture = captureConstructorFields(Controller, ['characterKind']);

      renderToStaticMarkup(React.createElement(Component));

      expect(capture.spies.characterKind).toBe(kind);
    });
  });
});
