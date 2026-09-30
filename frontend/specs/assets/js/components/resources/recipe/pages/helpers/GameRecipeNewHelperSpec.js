import { renderToStaticMarkup } from 'react-dom/server';
import GameRecipeNewHelper from '../../../../../../../../assets/js/components/resources/recipe/pages/helpers/GameRecipeNewHelper.jsx';
import { RECIPE_FORM_DEFAULTS } from '../../../../../../../../assets/js/components/resources/recipe/pages/recipeForm.js';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('GameRecipeNewHelper', function() {
  const handlers = new Proxy({}, { get: () => Noop.noop });
  const render = (overrides = {}) => renderToStaticMarkup(GameRecipeNewHelper.render({
    ...RECIPE_FORM_DEFAULTS, status: 'idle', fieldErrors: {}, canEditGame: true, game_slug: 'demo', ...overrides,
  }, handlers));

  it('renders every creation field and the submit button', function() {
    const html = render();

    expect(html).toContain('<form');
    expect(html).toContain('New Recipe');
    expect(html).toContain('id="recipe-new-name"');
    expect(html).toContain('Output');
    expect(html).toContain('id="recipe-new-yield"');
    expect(html).toContain('id="recipe-new-crafting-time"');
    expect(html).toContain('Edit crafting cost');
    expect(html).toContain('Ingredients');
    expect(html).toContain('Checks');
    expect(html).toContain('id="recipe-new-hidden"');
    expect(html).toContain('Create Recipe');
  });

  it('does not render any photo upload affordance', function() {
    expect(render()).not.toContain('bi-upload');
  });

  it('renders the invalid output error', function() {
    expect(render({ fieldErrors: { game_common_item_id: ['required'] } }))
      .toContain('The selected output item is invalid.');
  });
});
