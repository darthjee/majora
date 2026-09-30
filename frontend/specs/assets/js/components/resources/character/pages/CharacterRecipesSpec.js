import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterRecipes from '../../../../../../../assets/js/components/resources/character/pages/PcCharacterRecipes.jsx';
import NpcCharacterRecipes from '../../../../../../../assets/js/components/resources/character/pages/NpcCharacterRecipes.jsx';
import CharacterRecipesHelper
  from '../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterRecipesHelper.jsx';
import CharacterContextController
  from '../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterContextController.js';
import { resolveRecipeExchangeButton, buildRecipeExchangeCharacter }
  from '../../../../../../../assets/js/components/resources/character/pages/shared/CharacterRecipes.jsx';
import ResourceExchangeModalHelper
  from '../../../../../../../assets/js/components/resources/character/pages/elements/helpers/ResourceExchangeModalHelper.jsx';
import recipeExchangeTabs
  from '../../../../../../../assets/js/components/resources/character/pages/elements/recipeExchangeTabs.js';
import FacadeRefresh from '../../../../../../../assets/js/utils/access/useFacadeRefresh.js';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

const KINDS = [
  {
    label: 'PcCharacterRecipes', Component: PcCharacterRecipes, kind: 'pcs', listType: 'pc-recipes', characterId: '7',
  },
  {
    label: 'NpcCharacterRecipes', Component: NpcCharacterRecipes, kind: 'npcs', listType: 'npc-recipes', characterId: '9',
  },
];

KINDS.forEach(({
  label, Component, kind, listType, characterId,
}) => {
  describe(label, function() {
    let originalWindow;

    beforeEach(function() {
      originalWindow = globalThis.window;
      globalThis.window = { location: { hash: `#/games/demo/${kind}/${characterId}/recipes` } };
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

    it('resolves the game slug/character id from the hash and delegates to CharacterRecipesHelper', function() {
      const renderSpy = spyOn(CharacterRecipesHelper, 'render').and.callThrough();

      renderToStaticMarkup(React.createElement(Component));

      expect(renderSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          characterKind: kind,
          listType,
          gameSlug: 'demo',
          characterId,
          refreshToken: 0,
          itemsCount: null,
          canExchange: false,
        }),
        jasmine.objectContaining({ onItemsChange: jasmine.any(Function), onExchange: jasmine.any(Function) }),
      );
    });

    it('renders the recipe exchange modal configured with the acquire/remove tabs', function() {
      let capturedState;
      spyOn(ResourceExchangeModalHelper, 'render').and.callFake((show, state) => {
        capturedState = state;
        return React.createElement('div', null, 'modal');
      });

      renderToStaticMarkup(React.createElement(Component));

      expect(capturedState.activeTab).toBe('acquire');
      expect(capturedState.tabs).toBe(recipeExchangeTabs);
    });

    it('does not render the Exchange button before the character context loads', function() {
      const html = renderToStaticMarkup(React.createElement(Component));

      expect(html).not.toContain('Exchange');
    });
  });
});

describe('resolveRecipeExchangeButton', function() {
  it('is true when the character can exchange recipes', function() {
    expect(resolveRecipeExchangeButton({ can_exchange_recipe: true, can_edit: false })).toBe(true);
  });

  it('is false when the character cannot exchange recipes, even if it can be edited', function() {
    expect(resolveRecipeExchangeButton({ can_exchange_recipe: false, can_edit: true })).toBe(false);
  });

  it('is false while the character has not loaded yet', function() {
    expect(resolveRecipeExchangeButton(null)).toBe(false);
  });
});

describe('buildRecipeExchangeCharacter', function() {
  it('threads canEdit (character-level) and gameCanEdit (game-level) independently', function() {
    expect(buildRecipeExchangeCharacter('7', 'demo', true, { can_edit: true, game_can_edit: false })).toEqual({
      id: '7', game_slug: 'demo', is_pc: true, canEdit: true, gameCanEdit: false,
    });
  });

  it('defaults both flags to undefined while the character has not loaded yet', function() {
    expect(buildRecipeExchangeCharacter('9', 'demo', false, null)).toEqual({
      id: '9', game_slug: 'demo', is_pc: false, canEdit: undefined, gameCanEdit: undefined,
    });
  });
});
