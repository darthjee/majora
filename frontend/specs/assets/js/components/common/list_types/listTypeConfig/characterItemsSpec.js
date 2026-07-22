import listTypeConfig from '../../../../../../../assets/js/components/common/list_types/listTypeConfig.js';
import CharacterItemListItem from '../../../../../../../assets/js/components/common/list_types/CharacterItemListItem.js';
import HashRouteResolver from '../../../../../../../assets/js/utils/routing/HashRouteResolver.js';
import AccessStore from '../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';
import Translator from '../../../../../../../assets/js/i18n/Translator.js';

describe('listTypeConfig', function() {
  [
    ['pc-items', 'pcs', '#/games/demo/pcs/2/items'],
    ['npc-items', 'npcs', '#/games/demo/npcs/2/items'],
  ].forEach(([type, characterKind, hash]) => {
    describe(type, function() {
      const config = listTypeConfig[type];

      it('uses CharacterItemListItem as the wrapper class', function() {
        expect(config.wrapperClass).toBe(CharacterItemListItem);
      });

      it('has no filters component', function() {
        expect(config.filtersComponent).toBeNull();
      });

      it('uses the item photo type', function() {
        expect(config.photoType).toBe('item');
      });

      it('shows the caption text under the photo', function() {
        expect(config.showCaption).toBe(true);
      });

      it('renders 6 items per row (the default)', function() {
        expect(config.itemsPerRow).toBe(6);
      });

      describe('.buildItemHref', function() {
        it('links to the item detail page for this character (issue #724)', function() {
          const item = new CharacterItemListItem({ id: 1, game_item_id: 5, name: 'Cloak of Elvenkind' });

          expect(config.buildItemHref(item, { gameSlug: 'demo', characterId: '2' }))
            .toBe(`#/games/demo/${characterKind}/2/items/1`);
        });
      });

      describe('.buildActionBarProps', function() {
        it('is always non-manageable', function() {
          const item = new CharacterItemListItem({ id: 1, game_item_id: 5, name: 'Cloak of Elvenkind' });

          expect(config.buildActionBarProps(item, { gameSlug: 'demo', canEdit: true })).toEqual({
            canEdit: false, secondaryButtons: [],
          });
        });
      });

      describe('.buildInfoBarItems', function() {
        it('renders a hidden badge using the character items hidden label when hidden', function() {
          const item = new CharacterItemListItem({
            id: 1, game_item_id: 5, name: 'Cloak of Elvenkind', hidden: true,
          });

          const infoBarItems = config.buildInfoBarItems(item);

          expect(infoBarItems.length).toBe(1);
          expect(infoBarItems[0].label.props.items).toEqual([{
            icon: 'bi-eye-slash-fill',
            text: Translator.t('character_items_page.hidden_label'),
            variant: null,
          }]);
        });
      });

      describe('.fetchList', function() {
        afterEach(function() {
          RequestStore.reset();
        });

        it('fetches through RequestStore with the character-owned item collection and resolves canEdit false',
          async function() {
            const hashResolver = new HashRouteResolver(() => hash);

            spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
              data: [{ id: 1, game_item_id: 5, name: 'Cloak of Elvenkind' }],
              pagination: { page: 1, pages: 1, perPage: 10 },
            }));
            spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: false }));

            const result = await config.fetchList('demo', hashResolver);

            expect(AccessStore.ensureCharacterPermissions).toHaveBeenCalledWith(characterKind, 'demo', '2');
            expect(RequestStore.ensure).toHaveBeenCalledWith({
              resource: 'item',
              quantityType: 'collection',
              params: { gameSlug: 'demo', kind: characterKind, id: '2' },
              query: {},
            });
            expect(result.data).toEqual([{ id: 1, game_item_id: 5, name: 'Cloak of Elvenkind' }]);
            expect(result.canEdit).toBe(false);
          });

        it('resolves canEdit true when the requester can edit the character', async function() {
          const hashResolver = new HashRouteResolver(() => hash);

          spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
            data: [], pagination: { page: 1, pages: 1, perPage: 10 },
          }));
          spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));

          const result = await config.fetchList('demo', hashResolver);

          expect(result.canEdit).toBe(true);
        });

        it('defaults to canEdit false when the permission check fails', async function() {
          const hashResolver = new HashRouteResolver(() => hash);

          spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
            data: [], pagination: { page: 1, pages: 1, perPage: 10 },
          }));
          spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.reject(new Error('nope')));

          const result = await config.fetchList('demo', hashResolver);

          expect(result.canEdit).toBe(false);
        });

        it('defaults to an empty array when the response data is not an array', async function() {
          const hashResolver = new HashRouteResolver(() => hash);

          spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
            data: null, pagination: { page: 1, pages: 1, perPage: 10 },
          }));
          spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: false }));

          const result = await config.fetchList('demo', hashResolver);

          expect(result.data).toEqual([]);
        });
      });
    });
  });
});
