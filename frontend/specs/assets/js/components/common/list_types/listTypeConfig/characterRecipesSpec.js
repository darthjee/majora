import listTypeConfig from '../../../../../../../assets/js/components/common/list_types/listTypeConfig.js';
import GameRecipeListItem from '../../../../../../../assets/js/components/common/list_types/GameRecipeListItem.js';
import HashRouteResolver from '../../../../../../../assets/js/utils/routing/HashRouteResolver.js';
import AccessStore from '../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';
import Translator from '../../../../../../../assets/js/i18n/Translator.js';

describe('listTypeConfig (character recipes, issue #1450)', function() {
  [
    ['pc-recipes', 'pcs', '#/games/demo/pcs/2/recipes'],
    ['npc-recipes', 'npcs', '#/games/demo/npcs/2/recipes'],
  ].forEach(([type, characterKind, hash]) => {
    describe(type, function() {
      const config = listTypeConfig[type];
      const rawRecipe = {
        id: 1, game_recipe_id: 5, name: 'Healing Potion', output: null, yield_quantity: 2,
      };

      it('reuses GameRecipeListItem as the wrapper class', function() {
        expect(config.wrapperClass).toBe(GameRecipeListItem);
      });

      it('has no filters component and uses the recipe photo type', function() {
        expect(config.filtersComponent).toBeNull();
        expect(config.photoType).toBe('recipe');
        expect(config.showCaption).toBe(true);
        expect(config.itemsPerRow).toBe(6);
      });

      it('links to the character recipe detail page by row id', function() {
        const item = new GameRecipeListItem(rawRecipe);

        expect(config.buildItemHref(item, { gameSlug: 'demo', characterId: '2' }))
          .toBe(`#/games/demo/${characterKind}/2/recipes/1`);
      });

      it('is always non-manageable', function() {
        const item = new GameRecipeListItem(rawRecipe);

        expect(config.buildActionBarProps(item, { gameSlug: 'demo', canEdit: true })).toEqual({
          canEdit: false, secondaryButtons: [],
        });
      });

      it('renders a hidden badge using the character recipes hidden label when hidden', function() {
        const item = new GameRecipeListItem({ ...rawRecipe, hidden: true });

        const infoBarItems = config.buildInfoBarItems(item);

        expect(infoBarItems.length).toBe(1);
        expect(infoBarItems[0].label.props.items[0].text).toBe(Translator.t('character_recipes_page.hidden_label'));
      });

      it('renders no hidden badge when not hidden', function() {
        const item = new GameRecipeListItem(rawRecipe);

        expect(config.buildInfoBarItems(item).length).toBe(0);
      });

      describe('.fetchList', function() {
        afterEach(function() {
          RequestStore.reset();
        });

        it('fetches the characterRecipe collection resolving character-level permissions', async function() {
          const hashResolver = new HashRouteResolver(() => hash);

          spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
            data: [rawRecipe], pagination: { page: 1, pages: 1, perPage: 10 },
          }));
          spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));

          const result = await config.fetchList('demo', hashResolver);

          expect(AccessStore.ensureCharacterPermissions).toHaveBeenCalledWith(characterKind, 'demo', '2');
          expect(RequestStore.ensure).toHaveBeenCalledWith({
            componentName: 'ListPageController',
            resource: 'characterRecipe',
            quantityType: 'collection',
            params: { gameSlug: 'demo', kind: characterKind, id: '2' },
            query: {},
          });
          expect(result.data).toEqual([rawRecipe]);
          expect(result.canEdit).toBe(true);
        });
      });
    });
  });
});
