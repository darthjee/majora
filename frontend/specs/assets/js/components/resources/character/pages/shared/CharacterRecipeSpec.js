import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterRecipe from '../../../../../../../../assets/js/components/resources/character/pages/shared/CharacterRecipe.jsx';
import PcCharacterRecipe from '../../../../../../../../assets/js/components/resources/character/pages/PcCharacterRecipe.jsx';
import NpcCharacterRecipe from '../../../../../../../../assets/js/components/resources/character/pages/NpcCharacterRecipe.jsx';
import CharacterRecipeDetailHelper
  from '../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterRecipeDetailHelper.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

const loadedRecipe = {
  id: 3, game_recipe_id: 12, name: 'Healing Potion', output: null, yield_quantity: 1, hidden: false,
};
let lastController;

/** Stub controller that synchronously loads a recipe during construction. */
class LoadedController {
  constructor(characterKind, setRecipe, setLoading) {
    lastController = this;
    this.toggleHidden = jasmine.createSpy('toggleHidden');
    setRecipe(loadedRecipe);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

/** Stub controller that stays in the loading state. */
class LoadingController {
  buildEffect() { return () => Noop.noop; }
}

/** Stub controller that synchronously sets an error during construction. */
class ErroredController {
  constructor(characterKind, setRecipe, setLoading, setError) {
    setError('Recipe not found.');
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

[
  { characterKind: 'pcs', hash: '#/games/demo/pcs/7/recipes/3', listHref: '#/games/demo/pcs/7/recipes' },
  { characterKind: 'npcs', hash: '#/games/demo/npcs/9/recipes/3', listHref: '#/games/demo/npcs/9/recipes' },
].forEach(({ characterKind, hash, listHref }) => {
  describe(`CharacterRecipe (${characterKind})`, function() {
    let originalWindow;

    beforeEach(function() {
      originalWindow = globalThis.window;
      globalThis.window = { location: { hash } };
    });

    afterEach(function() {
      globalThis.window = originalWindow;
    });

    const render = (ControllerClass) => renderToStaticMarkup(
      React.createElement(CharacterRecipe, { characterKind, ControllerClass }),
    );

    it('renders the loading state', function() {
      expect(render(LoadingController)).toContain(Translator.t('character_recipe_page.loading'));
    });

    it('renders the not-found state with a back link to the list', function() {
      const html = render(ErroredController);

      expect(html).toContain('Recipe not found.');
      expect(html).toContain(`href="${listHref}"`);
    });

    it('delegates the loaded recipe to CharacterRecipeDetailHelper with the route context', function() {
      const renderSpy = spyOn(CharacterRecipeDetailHelper, 'render').and.callThrough();

      const html = render(LoadedController);

      expect(renderSpy).toHaveBeenCalledWith(
        loadedRecipe, { backHref: listHref, gameSlug: 'demo' }, { onHiddenChange: jasmine.any(Function) },
      );
      expect(html).toContain('Healing Potion');
    });

    it('routes hidden switch changes to the controller', function() {
      const renderSpy = spyOn(CharacterRecipeDetailHelper, 'render').and.callThrough();

      render(LoadedController);
      renderSpy.calls.mostRecent().args[2].onHiddenChange(true);

      expect(lastController.toggleHidden).toHaveBeenCalledWith(loadedRecipe, true);
    });
  });
});

describe('PcCharacterRecipe / NpcCharacterRecipe', function() {
  it('render CharacterRecipe with their character kind', function() {
    expect(PcCharacterRecipe().props.characterKind).toBe('pcs');
    expect(NpcCharacterRecipe().props.characterKind).toBe('npcs');
  });
});
