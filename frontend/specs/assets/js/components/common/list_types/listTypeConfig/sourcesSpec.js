import listTypeConfig from '../../../../../../../assets/js/components/common/list_types/listTypeConfig.js';
import SourceListItem from '../../../../../../../assets/js/components/common/list_types/SourceListItem.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildSource } from '../../../../../../support/factories.js';

function fakeHashResolver() {
  return { getPaginationParams: () => new URLSearchParams() };
}

describe('listTypeConfig', function() {
  describe('sources', function() {
    const { sources } = listTypeConfig;

    it('uses SourceListItem as the wrapper class', function() {
      expect(sources.wrapperClass).toBe(SourceListItem);
    });

    it('has no filters component', function() {
      expect(sources.filtersComponent).toBeNull();
    });

    it('uses the source photo type', function() {
      expect(sources.photoType).toBe('source');
    });

    it('shows the caption text under the photo', function() {
      expect(sources.showCaption).toBe(true);
    });

    it('renders 6 items per row', function() {
      expect(sources.itemsPerRow).toBe(6);
    });

    describe('.buildItemHref', function() {
      it('links to the source detail page', function() {
        const item = new SourceListItem(buildSource({ id: 7 }));

        expect(sources.buildItemHref(item)).toBe('#/miniatures/sources/7');
      });
    });

    describe('.buildActionBarProps', function() {
      it('is always non-manageable', function() {
        const item = new SourceListItem(buildSource());

        expect(sources.buildActionBarProps(item, {})).toEqual({ canEdit: false, secondaryButtons: [] });
      });
    });

    describe('.buildInfoBarItems', function() {
      it('is always empty', function() {
        const item = new SourceListItem(buildSource());

        expect(sources.buildInfoBarItems(item)).toEqual([]);
      });
    });

    describe('.fetchList', function() {
      afterEach(function() {
        RequestStore.reset();
      });

      it('fetches through RequestStore with no permission check', async function() {
        spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: [buildSource()],
          pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        const result = await sources.fetchList(undefined, fakeHashResolver());

        expect(RequestStore.ensure).toHaveBeenCalledWith({
          componentName: 'ListPageController', resource: 'source', quantityType: 'collection', params: {}, query: {},
        });
        expect(result.data).toEqual([buildSource()]);
        expect(result.pagination).toEqual({ page: 1, pages: 1, perPage: 10 });
        expect(result.canEdit).toBe(false);
      });

      it('defaults to an empty array when the response data is not an array', async function() {
        spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: null, pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        const result = await sources.fetchList(undefined, fakeHashResolver());

        expect(result.data).toEqual([]);
      });
    });
  });
});
