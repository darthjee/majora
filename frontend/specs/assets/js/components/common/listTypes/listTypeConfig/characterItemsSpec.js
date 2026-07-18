import listTypeConfig from '../../../../../../../assets/js/components/common/listTypes/listTypeConfig.js';
import CharacterItemListItem from '../../../../../../../assets/js/components/common/listTypes/CharacterItemListItem.js';
import HashRouteResolver from '../../../../../../../assets/js/utils/routing/HashRouteResolver.js';
import AccessStore from '../../../../../../../assets/js/utils/access/store/AccessStore.js';
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

      describe('.buildItemHref', function() {
        it('returns null, since items have no standalone detail page', function() {
          const item = new CharacterItemListItem({ id: 1, game_item_id: 5, name: 'Cloak of Elvenkind' });

          expect(config.buildItemHref(item)).toBeNull();
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
        it('fetches the player-facing endpoint when the requester cannot edit', async function() {
          const client = jasmine.createSpyObj('client', ['fetchIndex']);
          const hashResolver = new HashRouteResolver(() => hash);

          client.fetchIndex.and.returnValue(Promise.resolve({
            data: [{ id: 1, game_item_id: 5, name: 'Cloak of Elvenkind' }],
            pagination: { page: 1, pages: 1, perPage: 10 },
          }));
          spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: false }));

          const result = await config.fetchList('demo', hashResolver, client);

          expect(AccessStore.ensureCharacterPermissions).toHaveBeenCalledWith(characterKind, 'demo', '2');
          expect(client.fetchIndex).toHaveBeenCalledWith(`/games/demo/${characterKind}/2/items.json`);
          expect(result.data).toEqual([{ id: 1, game_item_id: 5, name: 'Cloak of Elvenkind' }]);
          expect(result.canEdit).toBe(false);
        });

        it('fetches the admin endpoint when the requester can edit', async function() {
          const client = jasmine.createSpyObj('client', ['fetchIndex']);
          const hashResolver = new HashRouteResolver(() => hash);

          client.fetchIndex.and.returnValue(Promise.resolve({
            data: [], pagination: { page: 1, pages: 1, perPage: 10 },
          }));
          spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));

          const result = await config.fetchList('demo', hashResolver, client);

          expect(client.fetchIndex).toHaveBeenCalledWith(`/games/demo/${characterKind}/2/items/all.json`);
          expect(result.canEdit).toBe(true);
        });

        it('defaults to the player-facing endpoint when the permission check fails', async function() {
          const client = jasmine.createSpyObj('client', ['fetchIndex']);
          const hashResolver = new HashRouteResolver(() => hash);

          client.fetchIndex.and.returnValue(Promise.resolve({
            data: [], pagination: { page: 1, pages: 1, perPage: 10 },
          }));
          spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.reject(new Error('nope')));

          const result = await config.fetchList('demo', hashResolver, client);

          expect(result.canEdit).toBe(false);
        });

        it('defaults to an empty array when the response data is not an array', async function() {
          const client = jasmine.createSpyObj('client', ['fetchIndex']);
          const hashResolver = new HashRouteResolver(() => hash);

          client.fetchIndex.and.returnValue(Promise.resolve({
            data: null, pagination: { page: 1, pages: 1, perPage: 10 },
          }));
          spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: false }));

          const result = await config.fetchList('demo', hashResolver, client);

          expect(result.data).toEqual([]);
        });
      });
    });
  });
});
