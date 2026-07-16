import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterTreasures from '../../../../../../../assets/js/components/resources/character/pages/PcCharacterTreasures.jsx';
import NpcCharacterTreasures from '../../../../../../../assets/js/components/resources/character/pages/NpcCharacterTreasures.jsx';
import CharacterTreasuresHelper from '../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterTreasuresHelper.jsx';
import { applyExchangeSuccess } from '../../../../../../../assets/js/components/resources/character/pages/shared/CharacterTreasures.jsx';
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

describe('applyExchangeSuccess', function() {
  it('refetches the character instead of locally patching its money', function() {
    const controller = jasmine.createSpyObj('controller', ['refreshCharacter']);
    const setTreasures = jasmine.createSpy('setTreasures');

    applyExchangeSuccess(controller, setTreasures, {
      treasureId: 9, treasureInfo: { name: 'Ring', value: 50 }, quantity: 3,
    });

    expect(controller.refreshCharacter).toHaveBeenCalled();
  });

  it('merges the exchanged treasure quantity into the treasures list', function() {
    const controller = jasmine.createSpyObj('controller', ['refreshCharacter']);
    const setTreasures = jasmine.createSpy('setTreasures');

    applyExchangeSuccess(controller, setTreasures, {
      treasureId: 9, treasureInfo: { name: 'Ring', value: 50 }, quantity: 3,
    });

    expect(setTreasures).toHaveBeenCalledWith(jasmine.any(Function));

    const updater = setTreasures.calls.mostRecent().args[0];
    expect(updater([])).toEqual([{
      id: 9, treasure_id: 9, quantity: 3, name: 'Ring', value: 50,
    }]);
  });
});
