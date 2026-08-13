import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterPossession
  from '../../../../../../../assets/js/components/resources/character/pages/PcCharacterPossession.jsx';
import NpcCharacterPossession
  from '../../../../../../../assets/js/components/resources/character/pages/NpcCharacterPossession.jsx';
import CharacterPossessionDetailController
  from '../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterPossessionDetailController.js';
import { stubBuildEffect, captureConstructorFields } from '../../../../../../support/controllerStubs.js';

const KINDS = [
  {
    label: 'PcCharacterPossession', Component: PcCharacterPossession, kind: 'pcs', hash: '#/games/demo/pcs/7/possessions/1',
  },
  {
    label: 'NpcCharacterPossession', Component: NpcCharacterPossession, kind: 'npcs', hash: '#/games/demo/npcs/9/possessions/1',
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

    it(`wires the shared CharacterPossession component with characterKind "${kind}"`, function() {
      stubBuildEffect(CharacterPossessionDetailController);
      capture = captureConstructorFields(CharacterPossessionDetailController, ['characterKind']);

      renderToStaticMarkup(React.createElement(Component));

      expect(capture.spies.characterKind).toBe(kind);
    });
  });
});
