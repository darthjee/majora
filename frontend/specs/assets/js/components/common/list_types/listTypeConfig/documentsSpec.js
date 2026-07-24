import listTypeConfig from '../../../../../../../assets/js/components/common/list_types/listTypeConfig.js';
import GameDocumentListItem from '../../../../../../../assets/js/components/common/list_types/GameDocumentListItem.js';
import HashRouteResolver from '../../../../../../../assets/js/utils/routing/HashRouteResolver.js';
import AccessStore from '../../../../../../../assets/js/utils/access/store/AccessStore.js';
import Translator from '../../../../../../../assets/js/i18n/Translator.js';

describe('listTypeConfig', function() {
  describe('documents', function() {
    const { documents } = listTypeConfig;

    it('uses GameDocumentListItem as the wrapper class', function() {
      expect(documents.wrapperClass).toBe(GameDocumentListItem);
    });

    it('has no filters component', function() {
      expect(documents.filtersComponent).toBeNull();
    });

    it('uses the document photo type', function() {
      expect(documents.photoType).toBe('document');
    });

    it('shows the caption text under the photo', function() {
      expect(documents.showCaption).toBe(true);
    });

    it('renders 6 items per row (the default)', function() {
      expect(documents.itemsPerRow).toBe(6);
    });

    describe('.buildItemHref', function() {
      it('links to the game document detail page (issue #758)', function() {
        const item = new GameDocumentListItem({ id: 5, name: 'Ancient Tome' });

        expect(documents.buildItemHref(item, { gameSlug: 'demo' })).toBe('#/games/demo/documents/5');
      });
    });

    describe('.buildActionBarProps', function() {
      it('is always non-manageable', function() {
        const item = new GameDocumentListItem({ id: 5, name: 'Ancient Tome' });

        expect(documents.buildActionBarProps(item, { gameSlug: 'demo', canEdit: true })).toEqual({
          canEdit: false, secondaryButtons: [],
        });
      });
    });

    describe('.buildInfoBarItems', function() {
      it('renders a hidden badge using the game documents hidden label when hidden', function() {
        const item = new GameDocumentListItem({ id: 5, name: 'Ancient Tome', hidden: true });

        const infoBarItems = documents.buildInfoBarItems(item);

        expect(infoBarItems.length).toBe(1);
        expect(infoBarItems[0].label.props.items).toEqual([{
          icon: 'bi-eye-slash-fill',
          text: Translator.t('game_documents_page.hidden_label'),
          variant: null,
        }]);
      });

      it('returns an empty array when not hidden', function() {
        const item = new GameDocumentListItem({ id: 5, name: 'Ancient Tome' });

        expect(documents.buildInfoBarItems(item)).toEqual([]);
      });
    });

    describe('.fetchList', function() {
      it('fetches the player-facing endpoint when the requester cannot edit', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const hashResolver = new HashRouteResolver(() => '#/games/demo/documents');

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [{ id: 5, name: 'Ancient Tome' }],
          pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

        const result = await documents.fetchList('demo', hashResolver, client);

        expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/documents.json', undefined);
        expect(result.data).toEqual([{ id: 5, name: 'Ancient Tome' }]);
        expect(result.canEdit).toBe(false);
      });

      it('fetches the admin endpoint when the requester can edit', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const hashResolver = new HashRouteResolver(() => '#/games/demo/documents');

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [], pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

        const result = await documents.fetchList('demo', hashResolver, client);

        expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/documents/all.json', undefined);
        expect(result.canEdit).toBe(true);
      });

      it('defaults to the player-facing endpoint when the permission check fails', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const hashResolver = new HashRouteResolver(() => '#/games/demo/documents');

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [], pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('nope')));

        const result = await documents.fetchList('demo', hashResolver, client);

        expect(result.canEdit).toBe(false);
      });

      it('defaults to an empty array when the response data is not an array', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const hashResolver = new HashRouteResolver(() => '#/games/demo/documents');

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: null, pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

        const result = await documents.fetchList('demo', hashResolver, client);

        expect(result.data).toEqual([]);
      });
    });
  });
});
