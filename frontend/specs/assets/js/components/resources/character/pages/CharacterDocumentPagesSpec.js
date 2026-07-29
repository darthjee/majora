import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterDocument
  from '../../../../../../../assets/js/components/resources/character/pages/PcCharacterDocument.jsx';
import NpcCharacterDocument
  from '../../../../../../../assets/js/components/resources/character/pages/NpcCharacterDocument.jsx';
import CharacterDocumentDetailController
  from '../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterDocumentDetailController.js';
import { stubBuildEffect, captureConstructorFields } from '../../../../../../support/controllerStubs.js';

const KINDS = [
  {
    label: 'PcCharacterDocument', Component: PcCharacterDocument, kind: 'pcs', hash: '#/games/demo/pcs/7/documents/1',
  },
  {
    label: 'NpcCharacterDocument',
    Component: NpcCharacterDocument,
    kind: 'npcs',
    hash: '#/games/demo/npcs/9/documents/1',
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

    it(`wires the shared CharacterDocument component with characterKind "${kind}"`, function() {
      stubBuildEffect(CharacterDocumentDetailController);
      capture = captureConstructorFields(CharacterDocumentDetailController, ['characterKind']);

      renderToStaticMarkup(React.createElement(Component));

      expect(capture.spies.characterKind).toBe(kind);
    });
  });
});
