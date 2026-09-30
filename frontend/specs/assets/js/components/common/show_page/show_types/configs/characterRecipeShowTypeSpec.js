import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import characterRecipeShowType
  from '../../../../../../../../assets/js/components/common/show_page/show_types/configs/characterRecipeShowType.js';
import ShowPageLayout from '../../../../../../../../assets/js/components/common/show_page/ShowPageLayout.jsx';
import CharacterRecipeHiddenField
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterRecipeHiddenField.jsx';
import CharacterRecipeGameRecipeLink
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterRecipeGameRecipeLink.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

const recipe = {
  id: 3,
  game_recipe_id: 12,
  name: 'Healing Potion',
  output: { id: 4, name: 'Potion', photo_path: '/potion.png' },
  yield_quantity: 2,
  crafting_time: '1 hour',
  crafting_cost: 50,
  description: 'Brew it.',
  ingredients: 'Herbs',
  checks: 'DC 12',
};

const render = (context) => renderToStaticMarkup(React.createElement(ShowPageLayout, {
  type: 'character_recipe',
  mode: 'show',
  context: {
    backHref: '#/games/demo/pcs/7/recipes', game_slug: 'demo', handlers: { onHiddenChange: jasmine.createSpy() }, ...context,
  },
}));

describe('characterRecipeShowType', function() {
  it('only declares Show variants', function() {
    [...characterRecipeShowType.left, ...characterRecipeShowType.right].forEach((entry) => {
      expect(Object.keys(entry)).toEqual(['Show']);
    });
  });

  it('places the hidden switch in the left column and the game recipe link in the right one', function() {
    expect(characterRecipeShowType.left.some((entry) => entry.Show === CharacterRecipeHiddenField)).toBe(true);
    expect(characterRecipeShowType.right.some((entry) => entry.Show === CharacterRecipeGameRecipeLink)).toBe(true);
  });

  it('renders the recipe fields, the back link and the game recipe link', function() {
    const html = render(recipe);

    expect(html).toContain('Healing Potion');
    expect(html).toContain('/potion.png');
    expect(html).toContain('href="#/games/demo/common_items/4"');
    expect(html).toContain('1 hour');
    expect(html).toContain('Brew it.');
    expect(html).toContain('Herbs');
    expect(html).toContain('DC 12');
    expect(html).toContain('href="#/games/demo/pcs/7/recipes"');
    expect(html).toContain(Translator.t('character_recipe_page.back_link'));
    expect(html).toContain('href="#/games/demo/recipes/12"');
  });

  it('renders the unknown output placeholder when the output is masked', function() {
    const html = render({ ...recipe, output: null });

    expect(html).toContain(Translator.t('recipe_page.unknown_output'));
    expect(html).not.toContain('common_items/');
  });

  it('omits the hidden switch on the regular variant', function() {
    expect(render(recipe)).not.toContain(Translator.t('character_recipe_page.hidden_toggle_label'));
  });

  it('renders the hidden switch on the full variant', function() {
    expect(render({ ...recipe, hidden: false })).toContain(Translator.t('character_recipe_page.hidden_toggle_label'));
  });
});
