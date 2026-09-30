import { renderToStaticMarkup } from 'react-dom/server';
import CharacterRecipeBackLink
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterRecipeBackLink.jsx';
import CharacterRecipeGameRecipeLink
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterRecipeGameRecipeLink.jsx';
import Translator from '../../../../../../../../../assets/js/i18n/Translator.js';

describe('CharacterRecipeBackLink', function() {
  it('links back to the recipes list', function() {
    const html = renderToStaticMarkup(CharacterRecipeBackLink({ backHref: '#/games/demo/npcs/9/recipes' }));

    expect(html).toContain('href="#/games/demo/npcs/9/recipes"');
    expect(html).toContain(Translator.t('character_recipe_page.back_link'));
  });
});

describe('CharacterRecipeGameRecipeLink', function() {
  it('links to the game recipe show page', function() {
    const html = renderToStaticMarkup(CharacterRecipeGameRecipeLink({ game_slug: 'demo', game_recipe_id: 12 }));

    expect(html).toContain('href="#/games/demo/recipes/12"');
    expect(html).toContain(Translator.t('character_recipe_page.game_recipe_link'));
  });
});
