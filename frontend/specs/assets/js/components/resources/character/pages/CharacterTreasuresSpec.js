import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterTreasures from '../../../../../../../assets/js/components/resources/character/pages/PcCharacterTreasures.jsx';
import NpcCharacterTreasures from '../../../../../../../assets/js/components/resources/character/pages/NpcCharacterTreasures.jsx';
import CharacterTreasuresHelper from '../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterTreasuresHelper.jsx';
import {
  mergeOwnedTreasures, buildExchangeCharacter, resolveExchangeButtonCanEdit,
} from '../../../../../../../assets/js/components/resources/character/pages/shared/CharacterTreasures.jsx';
import CharacterContextController
  from '../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterContextController.js';
import FacadeRefresh from '../../../../../../../assets/js/utils/access/useFacadeRefresh.js';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

const KINDS = [
  { label: 'PcCharacterTreasures', Component: PcCharacterTreasures, kind: 'pcs' },
  { label: 'NpcCharacterTreasures', Component: NpcCharacterTreasures, kind: 'npcs' },
];

KINDS.forEach(({ label, Component, kind }) => {
  describe(label, function() {
    let originalWindow;

    beforeEach(function() {
      originalWindow = globalThis.window;
      globalThis.window = { location: { hash: `#/games/demo/${kind}/7/treasures` } };
    });

    afterEach(function() {
      globalThis.window = originalWindow;
    });

    it('wires FacadeRefresh.useFacadeRefresh with the character context controller', function() {
      stubBuildEffect(CharacterContextController);
      spyOn(FacadeRefresh, 'useFacadeRefresh');

      renderToStaticMarkup(React.createElement(Component));

      expect(FacadeRefresh.useFacadeRefresh).toHaveBeenCalledWith(jasmine.any(CharacterContextController));
    });

    it('renders via CharacterTreasuresHelper.render with the expected list type/base path', function() {
      stubBuildEffect(CharacterContextController);
      const renderSpy = spyOn(CharacterTreasuresHelper, 'render').and.callThrough();

      renderToStaticMarkup(React.createElement(Component));

      const [state] = renderSpy.calls.mostRecent().args;
      expect(state.listType).toBe(`${kind === 'pcs' ? 'pc' : 'npc'}-treasures`);
      expect(state.gameSlug).toBe('demo');
      expect(state.basePath).toBe(`#/games/demo/${kind}/7/treasures`);
      expect(state.backHref).toBe(`#/games/demo/${kind}/7`);
    });

    it('renders without an "Exchange Treasure" button before the character loads', function() {
      stubBuildEffect(CharacterContextController);

      const html = renderToStaticMarkup(React.createElement(Component));

      expect(html).not.toContain('Exchange Treasure');
    });

    describe('filter query/clear interaction', function() {
      const basePath = `#/games/demo/${kind}/7/treasures`;

      it('updates the hash and re-triggers the fetch on filter query', function() {
        stubBuildEffect(CharacterContextController);
        const renderSpy = spyOn(CharacterTreasuresHelper, 'render').and.callThrough();

        renderToStaticMarkup(React.createElement(Component));

        const [, handlers] = renderSpy.calls.mostRecent().args;
        handlers.onFilterQuery({ name: 'sword' });

        expect(window.location.hash).toBe(`${basePath}?page=1&name=sword`);
      });

      it('resets the hash to the base path on filter clear', function() {
        stubBuildEffect(CharacterContextController);
        const renderSpy = spyOn(CharacterTreasuresHelper, 'render').and.callThrough();

        renderToStaticMarkup(React.createElement(Component));

        const [, handlers] = renderSpy.calls.mostRecent().args;
        handlers.onFilterClear();

        expect(window.location.hash).toBe(basePath);
      });
    });
  });
});

describe('mergeOwnedTreasures', function() {
  it('merges the exchanged treasure quantity into the owned-treasures snapshot', function() {
    const result = mergeOwnedTreasures([], {
      treasureId: 9, treasureInfo: { name: 'Ring', value: 50 }, quantity: 3,
    });

    expect(result).toEqual([{ id: 9, treasure_id: 9, quantity: 3, name: 'Ring', value: 50 }]);
  });
});

describe('buildExchangeCharacter', function() {
  it('threads canEdit from the loaded character\'s game_can_edit field', function() {
    const character = { money: 250, can_edit: true, game_can_edit: true };

    expect(buildExchangeCharacter('7', 'demo', true, character)).toEqual({
      id: '7', game_slug: 'demo', is_pc: true, money: 250, canEdit: true,
    });
  });

  it('threads canEdit as false when the loaded character\'s game_can_edit is false', function() {
    const character = { money: 100, can_edit: true, game_can_edit: false };

    expect(buildExchangeCharacter('7', 'demo', false, character)).toEqual({
      id: '7', game_slug: 'demo', is_pc: false, money: 100, canEdit: false,
    });
  });

  it('is not driven by the character-level can_edit field (a PC\'s own owning player can '
    + 'edit their character but must not be routed through the DM-only endpoints)', function() {
    const character = { money: 100, can_edit: true, game_can_edit: false };

    expect(buildExchangeCharacter('7', 'demo', true, character).canEdit).toBe(false);
  });

  it('defaults money to 0 and canEdit to undefined while the character has not loaded yet', function() {
    expect(buildExchangeCharacter('7', 'demo', true, null)).toEqual({
      id: '7', game_slug: 'demo', is_pc: true, money: 0, canEdit: undefined,
    });
  });
});

describe('resolveExchangeButtonCanEdit', function() {
  it('returns true when the loaded character can exchange treasure (e.g. staff, issue #712)', function() {
    const character = { can_edit: false, can_exchange_treasure: true };

    expect(resolveExchangeButtonCanEdit(character)).toBe(true);
  });

  it('returns false when the loaded character cannot exchange treasure, even if can_edit is true', function() {
    const character = { can_edit: true, can_exchange_treasure: false };

    expect(resolveExchangeButtonCanEdit(character)).toBe(false);
  });

  it('returns false when neither can_edit nor can_exchange_treasure is set', function() {
    const character = { can_edit: false, can_exchange_treasure: false };

    expect(resolveExchangeButtonCanEdit(character)).toBe(false);
  });

  it('returns undefined while the character has not loaded yet', function() {
    expect(resolveExchangeButtonCanEdit(null)).toBeUndefined();
  });
});
