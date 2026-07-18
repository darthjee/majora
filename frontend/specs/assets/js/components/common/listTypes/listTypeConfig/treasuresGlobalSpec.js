import listTypeConfig from '../../../../../../../assets/js/components/common/listTypes/listTypeConfig.js';
import TreasureListItem from '../../../../../../../assets/js/components/common/listTypes/TreasureListItem.js';
import TreasureFilters from '../../../../../../../assets/js/components/resources/treasure/pages/elements/TreasureFilters.jsx';
import TreasureCardHelper from '../../../../../../../assets/js/components/common/helpers/TreasureCardHelper.jsx';
import AccessStore from '../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('listTypeConfig', function() {
  describe('treasures-global', function() {
    const config = listTypeConfig['treasures-global'];

    it('uses TreasureListItem as the wrapper class', function() {
      expect(config.wrapperClass).toBe(TreasureListItem);
    });

    it('uses TreasureFilters as the filters component', function() {
      expect(config.filtersComponent).toBe(TreasureFilters);
    });

    it('uses the treasure photo type', function() {
      expect(config.photoType).toBe('treasure');
    });

    it('shows the caption text under the photo', function() {
      expect(config.showCaption).toBe(true);
    });

    describe('.buildItemHref', function() {
      it('links to the global treasure detail page', function() {
        const item = new TreasureListItem({ id: 42, name: 'Golden Crown', value: 500 });

        expect(config.buildItemHref(item)).toBe('#/treasures/42');
      });
    });

    describe('.buildInfoBarItems', function() {
      it('delegates to TreasureCardHelper.buildInfoBarItems', function() {
        const item = new TreasureListItem({ id: 1, name: 'Golden Crown', value: 500 });

        expect(config.buildInfoBarItems(item)).toEqual(TreasureCardHelper.buildInfoBarItems(item.data));
      });
    });

    describe('.buildActionBarProps', function() {
      it('grants upload access uniformly when canEdit is true, without a game_slug exclusivity check', function() {
        const item = new TreasureListItem({ id: 1, name: 'Golden Crown', value: 500, game_slug: 'other' });
        const props = config.buildActionBarProps(item, { canEdit: true });

        expect(props.canEdit).toBe(true);
      });

      it('denies upload access when canEdit is false', function() {
        const item = new TreasureListItem({ id: 1, name: 'Golden Crown', value: 500 });
        const props = config.buildActionBarProps(item, { canEdit: false });

        expect(props.canEdit).toBe(false);
      });

      it('invokes the context onUploadClick with the raw treasure on upload click', function() {
        const item = new TreasureListItem({ id: 1, name: 'Golden Crown', value: 500 });
        const onUploadClick = jasmine.createSpy('onUploadClick');
        const props = config.buildActionBarProps(item, { canEdit: true, onUploadClick });

        props.onClick();

        expect(onUploadClick).toHaveBeenCalledWith(item.data);
      });

      it('never renders a secondary edit button', function() {
        const item = new TreasureListItem({ id: 1, name: 'Golden Crown', value: 500 });

        expect(config.buildActionBarProps(item, { canEdit: true }).secondaryButtons).toEqual([]);
      });
    });

    describe('.fetchList', function() {
      it('fetches the global endpoint when the requester is staff or a superuser', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const hashResolver = { getFilterParams: () => new URLSearchParams() };

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [{ id: 1, name: 'Sword', value: 100 }],
          pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(true));

        const result = await config.fetchList(undefined, hashResolver, client);

        expect(client.fetchIndex).toHaveBeenCalledWith('/treasures.json', {});
        expect(result.data).toEqual([{ id: 1, name: 'Sword', value: 100 }]);
        expect(result.pagination).toEqual({ page: 1, pages: 1, perPage: 10 });
        expect(result.canEdit).toBe(true);
      });

      it('passes the game_type/min_value/max_value/name filter params from the hash resolver', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const hashResolver = {
          getFilterParams: () => new URLSearchParams({
            game_type: 'dnd', min_value: '10', max_value: '100', name: 'sword',
          }),
        };

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [], pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(true));

        await config.fetchList(undefined, hashResolver, client);

        expect(client.fetchIndex).toHaveBeenCalledWith('/treasures.json', {
          game_type: 'dnd', min_value: '10', max_value: '100', name: 'sword',
        });
      });

      it('defaults canEdit to false when the requester is neither staff nor a superuser', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const hashResolver = { getFilterParams: () => new URLSearchParams() };

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [], pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(false));

        const result = await config.fetchList(undefined, hashResolver, client);

        expect(result.canEdit).toBe(false);
      });

      it('defaults canEdit to false when the permission check fails', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const hashResolver = { getFilterParams: () => new URLSearchParams() };

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [], pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.reject(new Error('nope')));

        const result = await config.fetchList(undefined, hashResolver, client);

        expect(result.canEdit).toBe(false);
      });

      it('defaults to an empty array when the response data is not an array', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const hashResolver = { getFilterParams: () => new URLSearchParams() };

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: null, pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(true));

        const result = await config.fetchList(undefined, hashResolver, client);

        expect(result.data).toEqual([]);
      });
    });
  });
});
