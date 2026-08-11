import listTypeConfig from '../../../../../../../assets/js/components/common/list_types/listTypeConfig.js';
import CollectionListItem from '../../../../../../../assets/js/components/common/list_types/CollectionListItem.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildCollection } from '../../../../../../support/factories.js';

function fakeHashResolver() {
  return { getPaginationParams: () => new URLSearchParams() };
}

describe('listTypeConfig', function() {
  describe('collections', function() {
    const { collections } = listTypeConfig;

    it('uses CollectionListItem as the wrapper class', function() {
      expect(collections.wrapperClass).toBe(CollectionListItem);
    });

    it('has no filters component', function() {
      expect(collections.filtersComponent).toBeNull();
    });

    it('uses the collection photo type', function() {
      expect(collections.photoType).toBe('collection');
    });

    it('shows the caption text under the photo', function() {
      expect(collections.showCaption).toBe(true);
    });

    it('renders 6 items per row', function() {
      expect(collections.itemsPerRow).toBe(6);
    });

    describe('.buildItemHref', function() {
      it('links to the collection detail page', function() {
        const item = new CollectionListItem(buildCollection({ id: 7 }));

        expect(collections.buildItemHref(item)).toBe('#/miniatures/collections/7');
      });
    });

    describe('.buildActionBarProps', function() {
      it('is always non-manageable', function() {
        const item = new CollectionListItem(buildCollection());

        expect(collections.buildActionBarProps(item, {})).toEqual({ canEdit: false, secondaryButtons: [] });
      });
    });

    describe('.buildInfoBarItems', function() {
      it('is always empty', function() {
        const item = new CollectionListItem(buildCollection());

        expect(collections.buildInfoBarItems(item)).toEqual([]);
      });
    });

    describe('.fetchList', function() {
      afterEach(function() {
        RequestStore.reset();
      });

      it('fetches through RequestStore with no permission check', async function() {
        spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: [buildCollection()],
          pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        const result = await collections.fetchList(undefined, fakeHashResolver());

        expect(RequestStore.ensure).toHaveBeenCalledWith({
          componentName: 'ListPageController', resource: 'collection', quantityType: 'collection', params: {}, query: {},
        });
        expect(result.data).toEqual([buildCollection()]);
        expect(result.pagination).toEqual({ page: 1, pages: 1, perPage: 10 });
        expect(result.canEdit).toBe(false);
      });

      it('defaults to an empty array when the response data is not an array', async function() {
        spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: null, pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        const result = await collections.fetchList(undefined, fakeHashResolver());

        expect(result.data).toEqual([]);
      });
    });
  });
});
