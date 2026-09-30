import listTypeConfig from '../../../../../../../assets/js/components/common/list_types/listTypeConfig.js';
import GameRecipeListItem from '../../../../../../../assets/js/components/common/list_types/GameRecipeListItem.js';
import RecipeFilters
  from '../../../../../../../assets/js/components/resources/recipe/pages/elements/RecipeFilters.jsx';
import HashRouteResolver from '../../../../../../../assets/js/utils/routing/HashRouteResolver.js';
import AccessStore from '../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';
import Translator from '../../../../../../../assets/js/i18n/Translator.js';

describe('listTypeConfig', function() {
  describe('recipes', function() {
    const { recipes } = listTypeConfig;

    it('uses GameRecipeListItem as the wrapper class', function() {
      expect(recipes.wrapperClass).toBe(GameRecipeListItem);
    });

    it('uses RecipeFilters as the filters component', function() {
      expect(recipes.filtersComponent).toBe(RecipeFilters);
    });

    it('uses the recipe photo type', function() {
      expect(recipes.photoType).toBe('recipe');
    });

    it('shows the caption text under the photo', function() {
      expect(recipes.showCaption).toBe(true);
    });

    describe('.buildItemHref', function() {
      it('links to the recipe detail page', function() {
        const item = new GameRecipeListItem({ id: 5, name: 'Brew' });

        expect(recipes.buildItemHref(item, { gameSlug: 'demo' })).toBe('#/games/demo/recipes/5');
      });
    });

    describe('.buildActionBarProps', function() {
      it('is always non-manageable', function() {
        const item = new GameRecipeListItem({ id: 5, name: 'Brew' });

        expect(recipes.buildActionBarProps(item, { gameSlug: 'demo', canEdit: true })).toEqual({
          canEdit: false, secondaryButtons: [],
        });
      });
    });

    describe('.buildInfoBarItems', function() {
      it('renders a hidden badge using the game recipes hidden label when hidden', function() {
        const item = new GameRecipeListItem({ id: 5, name: 'Brew', hidden: true });

        const infoBarItems = recipes.buildInfoBarItems(item);

        expect(infoBarItems.length).toBe(1);
        expect(infoBarItems[0].label.props.items[0].text).toBe(Translator.t('game_recipes_page.hidden_label'));
      });

      it('returns an empty array when not hidden', function() {
        expect(recipes.buildInfoBarItems(new GameRecipeListItem({ id: 5, name: 'Brew' }))).toEqual([]);
      });
    });

    describe('.fetchList', function() {
      beforeEach(function() {
        spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: [{ id: 5, name: 'Brew' }],
          pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));
      });

      afterEach(function() {
        RequestStore.reset();
      });

      it('fetches through RequestStore with the recipe collection', async function() {
        const result = await recipes.fetchList('demo', new HashRouteResolver(() => '#/games/demo/recipes'));

        expect(RequestStore.ensure).toHaveBeenCalledWith({
          componentName: 'ListPageController',
          resource: 'recipe',
          quantityType: 'collection',
          params: { gameSlug: 'demo' },
          query: {},
        });
        expect(result.data).toEqual([{ id: 5, name: 'Brew' }]);
        expect(result.canEdit).toBe(true);
      });

      it('forwards a valid category filter and pagination', async function() {
        await recipes.fetchList('demo', new HashRouteResolver(() => '#/games/demo/recipes?page=2&category=potion'));

        expect(RequestStore.ensure.calls.mostRecent().args[0].query).toEqual({ page: '2', category: 'potion' });
      });

      it('ignores an unknown category filter', async function() {
        await recipes.fetchList('demo', new HashRouteResolver(() => '#/games/demo/recipes?category=bogus'));

        expect(RequestStore.ensure.calls.mostRecent().args[0].query).toEqual({});
      });
    });
  });
});
