import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterDocuments from '../../../../../../../assets/js/components/resources/character/pages/PcCharacterDocuments.jsx';
import NpcCharacterDocuments from '../../../../../../../assets/js/components/resources/character/pages/NpcCharacterDocuments.jsx';
import CharacterDocumentsHelper
  from '../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterDocumentsHelper.jsx';
import CharacterContextController
  from '../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterContextController.js';
import ResourceExchangeModalHelper
  from '../../../../../../../assets/js/components/resources/character/pages/elements/helpers/ResourceExchangeModalHelper.jsx';
import { buildDocumentExchangeCharacter } from '../../../../../../../assets/js/components/resources/character/pages/shared/CharacterDocuments.jsx';
import FacadeRefresh from '../../../../../../../assets/js/utils/access/useFacadeRefresh.js';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

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
      stubBuildEffect(CharacterContextController);
    });

    afterEach(function() {
      globalThis.window = originalWindow;
    });

    it('wires FacadeRefresh.useFacadeRefresh with the character context controller', function() {
      spyOn(FacadeRefresh, 'useFacadeRefresh');

      renderToStaticMarkup(React.createElement(Component));

      expect(FacadeRefresh.useFacadeRefresh).toHaveBeenCalledWith(jasmine.any(CharacterContextController));
    });

    it('resolves the game slug/character id from the hash and delegates to CharacterDocumentsHelper', function() {
      const renderSpy = spyOn(CharacterDocumentsHelper, 'render').and.callThrough();

      renderToStaticMarkup(React.createElement(Component));

      expect(renderSpy).toHaveBeenCalledWith(kind, listType, 'demo', characterId, 0, jasmine.any(Function));
    });

    it('renders the document exchange modal configured with the acquire/remove tabs', function() {
      let capturedState;
      spyOn(ResourceExchangeModalHelper, 'render').and.callFake((show, state) => {
        capturedState = state;
        return React.createElement('div', null, 'modal');
      });

      renderToStaticMarkup(React.createElement(Component));

      expect(capturedState.activeTab).toBe('acquire');
      expect(capturedState.tabs.acquire).toBeDefined();
      expect(capturedState.tabs.remove).toBeDefined();
      expect(capturedState.tabs.buy).toBeUndefined();
    });
  });
});

describe('buildDocumentExchangeCharacter', function() {
  it('threads canEdit (character-level) and gameCanEdit (game-level) independently', function() {
    const character = { can_edit: true, game_can_edit: false };

    expect(buildDocumentExchangeCharacter('7', 'demo', true, character)).toEqual({
      id: '7', game_slug: 'demo', is_pc: true, canEdit: true, gameCanEdit: false,
    });
  });

  it('threads gameCanEdit true independently of canEdit', function() {
    const character = { can_edit: false, game_can_edit: true };

    expect(buildDocumentExchangeCharacter('7', 'demo', false, character)).toEqual({
      id: '7', game_slug: 'demo', is_pc: false, canEdit: false, gameCanEdit: true,
    });
  });

  it('defaults both flags to undefined while the character has not loaded yet', function() {
    expect(buildDocumentExchangeCharacter('7', 'demo', true, null)).toEqual({
      id: '7', game_slug: 'demo', is_pc: true, canEdit: undefined, gameCanEdit: undefined,
    });
  });
});
