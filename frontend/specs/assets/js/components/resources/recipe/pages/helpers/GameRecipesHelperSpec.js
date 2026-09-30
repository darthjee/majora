import { renderToStaticMarkup } from 'react-dom/server';
import GameRecipesHelper
  from '../../../../../../../../assets/js/components/resources/recipe/pages/helpers/GameRecipesHelper.jsx';
import ListPage from '../../../../../../../../assets/js/components/common/list_page/ListPage.jsx';

describe('GameRecipesHelper', function() {
  const handlers = {
    onFilterQuery: jasmine.createSpy('onFilterQuery'),
    onItemsChange: jasmine.createSpy('onItemsChange'),
  };
  const buildState = (overrides = {}) => ({
    gameSlug: 'demo',
    basePath: '#/games/demo/recipes',
    backHref: '#/games/demo',
    newHref: '#/games/demo/recipes/new',
    canCreateRecipe: false,
    activeFilters: { category: 'potion' },
    refreshToken: 3,
    itemsCount: null,
    ...overrides,
  });
  const render = (overrides) => renderToStaticMarkup(GameRecipesHelper.render(buildState(overrides), handlers));
  const findListPage = (element) => element.props.children.find((child) => child?.type === ListPage);

  describe('.render', function() {
    it('renders a back button to the parent game page', function() {
      expect(render()).toContain('href="#/games/demo"');
    });

    it('renders the recipes heading', function() {
      expect(render()).toContain('<h1 class="mb-4">Recipes</h1>');
    });

    it('does not render the new button when canCreateRecipe is false', function() {
      expect(render()).not.toContain('New Recipe');
    });

    it('renders the new button when canCreateRecipe is true', function() {
      const html = render({ canCreateRecipe: true });

      expect(html).toContain('New Recipe');
      expect(html).toContain('href="#/games/demo/recipes/new"');
    });

    it('wires a ListPage of type recipes with filters, refresh token and items handler', function() {
      const listPage = findListPage(GameRecipesHelper.render(buildState(), handlers));

      expect(listPage.props.type).toBe('recipes');
      expect(listPage.props.gameSlug).toBe('demo');
      expect(listPage.props.basePath).toBe('#/games/demo/recipes');
      expect(listPage.props.filters).toEqual({
        props: { onQuery: handlers.onFilterQuery }, active: { category: 'potion' },
      });
      expect(listPage.props.refreshToken).toBe(3);
      expect(listPage.props.handlers).toEqual({ onItemsChange: handlers.onItemsChange });
    });

    it('does not render the empty message before the list loads', function() {
      expect(render()).not.toContain('No recipes found.');
    });

    it('does not render the empty message when there are recipes', function() {
      expect(render({ itemsCount: 2 })).not.toContain('No recipes found.');
    });

    it('renders the empty message when the list is empty', function() {
      expect(render({ itemsCount: 0 })).toContain('No recipes found.');
    });
  });
});
