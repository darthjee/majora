import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterPossessionEdit
  from '../../../../../../../assets/js/components/resources/character/pages/PcCharacterPossessionEdit.jsx';
import NpcCharacterPossessionEdit
  from '../../../../../../../assets/js/components/resources/character/pages/NpcCharacterPossessionEdit.jsx';
import PcCharacterPossessionEditController
  from '../../../../../../../assets/js/components/resources/character/pages/controllers/PcCharacterPossessionEditController.js';
import NpcCharacterPossessionEditController
  from '../../../../../../../assets/js/components/resources/character/pages/controllers/NpcCharacterPossessionEditController.js';
import { stubBuildEffect, captureConstructorFields } from '../../../../../../support/controllerStubs.js';

const KINDS = [
  {
    label: 'PcCharacterPossessionEdit',
    Component: PcCharacterPossessionEdit,
    Controller: PcCharacterPossessionEditController,
    kind: 'pcs',
    hash: '#/games/demo/pcs/7/possessions/1/edit',
  },
  {
    label: 'NpcCharacterPossessionEdit',
    Component: NpcCharacterPossessionEdit,
    Controller: NpcCharacterPossessionEditController,
    kind: 'npcs',
    hash: '#/games/demo/npcs/9/possessions/1/edit',
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

    it(`wires the shared CharacterPossessionEdit component with characterKind "${kind}"`, function() {
      stubBuildEffect(Controller);
      capture = captureConstructorFields(Controller, ['characterKind']);

      renderToStaticMarkup(React.createElement(Component));

      expect(capture.spies.characterKind).toBe(kind);
    });
  });
});
