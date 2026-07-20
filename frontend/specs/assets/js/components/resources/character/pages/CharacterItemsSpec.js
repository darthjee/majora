import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterItems from '../../../../../../../assets/js/components/resources/character/pages/PcCharacterItems.jsx';
import NpcCharacterItems from '../../../../../../../assets/js/components/resources/character/pages/NpcCharacterItems.jsx';
import CharacterItemsHelper from '../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterItemsHelper.jsx';
import CharacterItemsAccessController
  from '../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterItemsAccessController.js';
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
    });

    afterEach(function() {
      globalThis.window = originalWindow;
    });

    it('wires FacadeRefresh.useFacadeRefresh with the items access controller', function() {
      stubBuildEffect(CharacterItemsAccessController);
      spyOn(FacadeRefresh, 'useFacadeRefresh');

      renderToStaticMarkup(React.createElement(Component));

      expect(FacadeRefresh.useFacadeRefresh).toHaveBeenCalledWith(jasmine.any(CharacterItemsAccessController));
    });

    it('resolves the game slug/character id from the hash and delegates to CharacterItemsHelper', function() {
      stubBuildEffect(CharacterItemsAccessController);
      const renderSpy = spyOn(CharacterItemsHelper, 'render').and.callThrough();

      renderToStaticMarkup(React.createElement(Component));

      expect(renderSpy).toHaveBeenCalledWith(kind, listType, 'demo', characterId, false);
    });
  });
});
