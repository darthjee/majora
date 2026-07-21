import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterDocuments from '../../../../../../../assets/js/components/resources/character/pages/PcCharacterDocuments.jsx';
import NpcCharacterDocuments from '../../../../../../../assets/js/components/resources/character/pages/NpcCharacterDocuments.jsx';
import CharacterDocumentsHelper
  from '../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterDocumentsHelper.jsx';

const KINDS = [
  {
    label: 'PcCharacterDocuments', Component: PcCharacterDocuments, kind: 'pcs', listType: 'pc-documents', characterId: '7',
  },
  {
    label: 'NpcCharacterDocuments', Component: NpcCharacterDocuments, kind: 'npcs', listType: 'npc-documents', characterId: '9',
  },
];

KINDS.forEach(({
  label, Component, kind, listType, characterId,
}) => {
  describe(label, function() {
    let originalWindow;

    beforeEach(function() {
      originalWindow = globalThis.window;
      globalThis.window = { location: { hash: `#/games/demo/${kind}/${characterId}/documents` } };
    });

    afterEach(function() {
      globalThis.window = originalWindow;
    });

    it('resolves the game slug/character id from the hash and delegates to CharacterDocumentsHelper', function() {
      const renderSpy = spyOn(CharacterDocumentsHelper, 'render').and.callThrough();

      renderToStaticMarkup(React.createElement(Component));

      expect(renderSpy).toHaveBeenCalledWith(kind, listType, 'demo', characterId);
    });
  });
});
