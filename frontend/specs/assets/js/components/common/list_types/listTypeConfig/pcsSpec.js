import listTypeConfig from '../../../../../../../assets/js/components/common/list_types/listTypeConfig.js';
import PcListItem from '../../../../../../../assets/js/components/common/list_types/PcListItem.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';

function fakeHashResolver() {
  return { getPaginationParams: () => new URLSearchParams() };
}

describe('listTypeConfig', function() {
  describe('pcs', function() {
    const { pcs } = listTypeConfig;

    it('uses PcListItem as the wrapper class', function() {
      expect(pcs.wrapperClass).toBe(PcListItem);
    });

    it('has no filters component', function() {
      expect(pcs.filtersComponent).toBeNull();
    });

    it('uses the avatar photo type', function() {
      expect(pcs.photoType).toBe('avatar');
    });

    it('shows the caption text under the photo', function() {
      expect(pcs.showCaption).toBe(true);
    });

    it('renders 4 items per row', function() {
      expect(pcs.itemsPerRow).toBe(4);
    });

    describe('.buildItemHref', function() {
      it('links to the pc detail page', function() {
        const item = new PcListItem({ id: 1, name: 'Aragorn' });

        expect(pcs.buildItemHref(item, { gameSlug: 'demo' })).toBe('#/games/demo/pcs/1');
      });
    });

    describe('.buildActionBarProps', function() {
      it('is always non-manageable', function() {
        const item = new PcListItem({ id: 1, name: 'Aragorn' });

        expect(pcs.buildActionBarProps(item, { gameSlug: 'demo', canEdit: true })).toEqual({
          canEdit: false, secondaryButtons: [],
        });
      });
    });

    describe('.buildInfoBarItems', function() {
      it('returns an empty array for a plain PC', function() {
        const item = new PcListItem({ id: 1, name: 'Aragorn', is_pc: true });

        expect(pcs.buildInfoBarItems(item)).toEqual([]);
      });
    });

    describe('.fetchList', function() {
      afterEach(function() {
        RequestStore.reset();
      });

      it('fetches through RequestStore with no permission check', async function() {
        spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: [{ id: 1, name: 'Aragorn' }],
          pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        const result = await pcs.fetchList('demo', fakeHashResolver());

        expect(RequestStore.ensure).toHaveBeenCalledWith({
          componentName: 'ListPageController',
          resource: 'pc',
          quantityType: 'collection',
          params: { gameSlug: 'demo' },
          query: {},
        });
        expect(result.data).toEqual([{ id: 1, name: 'Aragorn' }]);
        expect(result.canEdit).toBe(false);
      });

      it('defaults to an empty array when the response data is not an array', async function() {
        spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: null, pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        const result = await pcs.fetchList('demo', fakeHashResolver());

        expect(result.data).toEqual([]);
      });
    });
  });
});
