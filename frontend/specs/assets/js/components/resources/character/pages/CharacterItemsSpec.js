import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterItems from '../../../../../../../assets/js/components/resources/character/pages/PcCharacterItems.jsx';
import NpcCharacterItems from '../../../../../../../assets/js/components/resources/character/pages/NpcCharacterItems.jsx';
import CharacterItemsHelper from '../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterItemsHelper.jsx';
import CharacterItemsAccessController
  from '../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterItemsAccessController.js';
import CharacterContextController
  from '../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterContextController.js';
import ResourceExchangeModalHelper
  from '../../../../../../../assets/js/components/resources/character/pages/elements/helpers/ResourceExchangeModalHelper.jsx';
import { buildItemExchangeCharacter } from '../../../../../../../assets/js/components/resources/character/pages/shared/CharacterItems.jsx';
import FacadeRefresh from '../../../../../../../assets/js/utils/access/useFacadeRefresh.js';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

const KINDS = [
  {
    label: 'PcCharacterItems', Component: PcCharacterItems, kind: 'pcs', listType: 'pc-items', characterId: '7',
  },
  {
    label: 'NpcCharacterItems', Component: NpcCharacterItems, kind: 'npcs', listType: 'npc-items', characterId: '9',
  },
];

KINDS.forEach(({
  label, Component, kind, listType, characterId,
}) => {
  describe(label, function() {
    let originalWindow;

    beforeEach(function() {
      originalWindow = globalThis.window;
      globalThis.window = { location: { hash: `#/games/demo/${kind}/${characterId}/items` } };
      stubBuildEffect(CharacterItemsAccessController);
      stubBuildEffect(CharacterContextController);
    });

    afterEach(function() {
      globalThis.window = originalWindow;
    });

    it('wires FacadeRefresh.useFacadeRefresh with the items access controller', function() {
      spyOn(FacadeRefresh, 'useFacadeRefresh');

      renderToStaticMarkup(React.createElement(Component));

      expect(FacadeRefresh.useFacadeRefresh).toHaveBeenCalledWith(jasmine.any(CharacterItemsAccessController));
    });

    it('wires FacadeRefresh.useFacadeRefresh with the character context controller', function() {
      spyOn(FacadeRefresh, 'useFacadeRefresh');

      renderToStaticMarkup(React.createElement(Component));

      expect(FacadeRefresh.useFacadeRefresh).toHaveBeenCalledWith(jasmine.any(CharacterContextController));
    });

    it('resolves the game slug/character id from the hash and delegates to CharacterItemsHelper', function() {
      const renderSpy = spyOn(CharacterItemsHelper, 'render').and.callThrough();

      renderToStaticMarkup(React.createElement(Component));

      expect(renderSpy).toHaveBeenCalledWith(
        kind, listType, 'demo', characterId, false, 0, jasmine.any(Function),
      );
    });

    it('renders the item exchange modal configured with the acquire/remove tabs', function() {
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

describe('buildItemExchangeCharacter', function() {
  it('threads canEdit (character-level) and gameCanEdit (game-level) independently', function() {
    const character = { can_edit: true, game_can_edit: false };

    expect(buildItemExchangeCharacter('7', 'demo', true, character)).toEqual({
      id: '7', game_slug: 'demo', is_pc: true, canEdit: true, gameCanEdit: false,
    });
  });

  it('threads gameCanEdit true independently of canEdit', function() {
    const character = { can_edit: false, game_can_edit: true };

    expect(buildItemExchangeCharacter('7', 'demo', false, character)).toEqual({
      id: '7', game_slug: 'demo', is_pc: false, canEdit: false, gameCanEdit: true,
    });
  });

  it('defaults both flags to undefined while the character has not loaded yet', function() {
    expect(buildItemExchangeCharacter('7', 'demo', true, null)).toEqual({
      id: '7', game_slug: 'demo', is_pc: true, canEdit: undefined, gameCanEdit: undefined,
    });
  });
});
