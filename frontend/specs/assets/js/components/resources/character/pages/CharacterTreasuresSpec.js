import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterTreasures from '../../../../../../../assets/js/components/resources/character/pages/PcCharacterTreasures.jsx';
import NpcCharacterTreasures from '../../../../../../../assets/js/components/resources/character/pages/NpcCharacterTreasures.jsx';
import CharacterTreasuresHelper from '../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterTreasuresHelper.jsx';
import PcCharacterTreasuresController
  from '../../../../../../../assets/js/components/resources/character/pages/controllers/PcCharacterTreasuresController.js';
import NpcCharacterTreasuresController
  from '../../../../../../../assets/js/components/resources/character/pages/controllers/NpcCharacterTreasuresController.js';
import FacadeRefresh from '../../../../../../../assets/js/utils/access/useFacadeRefresh.js';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';

const KINDS = [
  { label: 'PcCharacterTreasures', Component: PcCharacterTreasures, Controller: PcCharacterTreasuresController, kind: 'pcs' },
  { label: 'NpcCharacterTreasures', Component: NpcCharacterTreasures, Controller: NpcCharacterTreasuresController, kind: 'npcs' },
];

KINDS.forEach(({ label, Component, Controller, kind }) => {
  describe(label, function() {
    it('renders the loading state while fetching', function() {
      stubBuildEffect(Controller);
      stubRenderLoading(CharacterTreasuresHelper);

      const html = renderToStaticMarkup(React.createElement(Component));

      expect(html).toContain('loading');
    });

    it('wires FacadeRefresh.useFacadeRefresh with the page controller', function() {
      stubBuildEffect(Controller);
      spyOn(FacadeRefresh, 'useFacadeRefresh');

      renderToStaticMarkup(React.createElement(Component));

      expect(FacadeRefresh.useFacadeRefresh).toHaveBeenCalledWith(jasmine.any(Controller));
    });

    it('renders the error state via CharacterTreasuresHelper.renderError', function() {
      const html = renderToStaticMarkup(CharacterTreasuresHelper.renderError('Unable to load treasures.'));

      expect(html).toContain('Unable to load treasures.');
    });

    it('renders the treasures table via CharacterTreasuresHelper.render', function() {
      stubBuildEffect(Controller);

      const treasures = [{ id: 1, name: 'Golden Crown', quantity: 1, value: 500 }];
      const pagination = { page: 1, pages: 1, perPage: 10 };
      const html = renderToStaticMarkup(
        CharacterTreasuresHelper.render(
          treasures, pagination, `#/games/demo/${kind}/7/treasures`, `#/games/demo/${kind}/7`,
        )
      );

      expect(html).toContain('Golden Crown');
      expect(html).toContain(`href="#/games/demo/${kind}/7"`);
    });
  });
});
