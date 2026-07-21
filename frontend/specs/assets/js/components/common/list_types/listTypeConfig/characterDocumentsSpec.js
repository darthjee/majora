import listTypeConfig from '../../../../../../../assets/js/components/common/list_types/listTypeConfig.js';
import CharacterDocumentListItem
  from '../../../../../../../assets/js/components/common/list_types/CharacterDocumentListItem.js';
import HashRouteResolver from '../../../../../../../assets/js/utils/routing/HashRouteResolver.js';
import AccessStore from '../../../../../../../assets/js/utils/access/store/AccessStore.js';
import Translator from '../../../../../../../assets/js/i18n/Translator.js';

describe('listTypeConfig', function() {
  [
    ['pc-documents', 'pcs', '#/games/demo/pcs/2/documents'],
    ['npc-documents', 'npcs', '#/games/demo/npcs/2/documents'],
  ].forEach(([type, characterKind, hash]) => {
    describe(type, function() {
      const config = listTypeConfig[type];

      it('uses CharacterDocumentListItem as the wrapper class', function() {
        expect(config.wrapperClass).toBe(CharacterDocumentListItem);
      });

      it('has no filters component', function() {
        expect(config.filtersComponent).toBeNull();
      });

      it('uses the document photo type', function() {
        expect(config.photoType).toBe('document');
      });

      it('shows the caption text under the photo', function() {
        expect(config.showCaption).toBe(true);
      });

      it('renders 6 items per row (the default)', function() {
        expect(config.itemsPerRow).toBe(6);
      });

      describe('.buildItemHref', function() {
        it('returns null, since documents have no standalone detail page (issue #725)', function() {
          const item = new CharacterDocumentListItem({ id: 1, game_document_id: 5, name: 'Ancient Tome' });

          expect(config.buildItemHref(item, { gameSlug: 'demo', characterId: '2' })).toBeNull();
        });
      });

      describe('.buildActionBarProps', function() {
        it('is always non-manageable', function() {
          const item = new CharacterDocumentListItem({ id: 1, game_document_id: 5, name: 'Ancient Tome' });

          expect(config.buildActionBarProps(item, { gameSlug: 'demo', canEdit: true })).toEqual({
            canEdit: false, secondaryButtons: [],
          });
        });
      });

      describe('.buildInfoBarItems', function() {
        it('renders a hidden badge using the character documents hidden label when hidden', function() {
          const item = new CharacterDocumentListItem({
            id: 1, game_document_id: 5, name: 'Ancient Tome', hidden: true,
          });

          const infoBarItems = config.buildInfoBarItems(item);

          expect(infoBarItems.length).toBe(1);
          expect(infoBarItems[0].label.props.items).toEqual([{
            icon: 'bi-eye-slash-fill',
            text: Translator.t('character_documents_page.hidden_label'),
            variant: null,
          }]);
        });
      });

      describe('.fetchList', function() {
        it('fetches the player-facing endpoint when the requester cannot edit', async function() {
          const client = jasmine.createSpyObj('client', ['fetchIndex']);
          const hashResolver = new HashRouteResolver(() => hash);

          client.fetchIndex.and.returnValue(Promise.resolve({
            data: [{ id: 1, game_document_id: 5, name: 'Ancient Tome' }],
            pagination: { page: 1, pages: 1, perPage: 10 },
          }));
          spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: false }));

          const result = await config.fetchList('demo', hashResolver, client);

          expect(AccessStore.ensureCharacterPermissions).toHaveBeenCalledWith(characterKind, 'demo', '2');
          expect(client.fetchIndex).toHaveBeenCalledWith(`/games/demo/${characterKind}/2/documents.json`, undefined);
          expect(result.data).toEqual([{ id: 1, game_document_id: 5, name: 'Ancient Tome' }]);
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

          expect(client.fetchIndex)
            .toHaveBeenCalledWith(`/games/demo/${characterKind}/2/documents/all.json`, undefined);
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
