import listTypeConfig from '../../../../../../../assets/js/components/common/list_types/listTypeConfig.js';
import StlModelListItem from '../../../../../../../assets/js/components/common/list_types/StlModelListItem.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildStlModel } from '../../../../../../support/factories.js';

function fakeHashResolver() {
  return { getPaginationParams: () => new URLSearchParams() };
}

describe('listTypeConfig', function() {
  describe('stlModels', function() {
    const { stlModels } = listTypeConfig;

    it('uses StlModelListItem as the wrapper class', function() {
      expect(stlModels.wrapperClass).toBe(StlModelListItem);
    });

    it('has no filters component', function() {
      expect(stlModels.filtersComponent).toBeNull();
    });

    it('uses the stl_model photo type', function() {
      expect(stlModels.photoType).toBe('stl_model');
    });

    it('shows the caption text under the photo', function() {
      expect(stlModels.showCaption).toBe(true);
    });

    it('renders 6 items per row', function() {
      expect(stlModels.itemsPerRow).toBe(6);
    });

    describe('.buildItemHref', function() {
      it('links to the STL model detail page', function() {
        const item = new StlModelListItem(buildStlModel({ id: 7 }));

        expect(stlModels.buildItemHref(item)).toBe('#/miniatures/stl_models/7');
      });
    });

    describe('.buildActionBarProps', function() {
      it('is always non-manageable', function() {
        const item = new StlModelListItem(buildStlModel());

        expect(stlModels.buildActionBarProps(item, {})).toEqual({ canEdit: false, secondaryButtons: [] });
      });
    });

    describe('.buildInfoBarItems', function() {
      it('is always empty', function() {
        const item = new StlModelListItem(buildStlModel());

        expect(stlModels.buildInfoBarItems(item)).toEqual([]);
      });
    });

    describe('.fetchList', function() {
      afterEach(function() {
        RequestStore.reset();
      });

      it('fetches through RequestStore with no permission check', async function() {
        spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: [buildStlModel()],
          pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        const result = await stlModels.fetchList(undefined, fakeHashResolver());

        expect(RequestStore.ensure).toHaveBeenCalledWith({
          componentName: 'ListPageController', resource: 'stlModel', quantityType: 'collection', params: {}, query: {},
        });
        expect(result.data).toEqual([buildStlModel()]);
        expect(result.pagination).toEqual({ page: 1, pages: 1, perPage: 10 });
        expect(result.canEdit).toBe(false);
      });

      it('defaults to an empty array when the response data is not an array', async function() {
        spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: null, pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        const result = await stlModels.fetchList(undefined, fakeHashResolver());

        expect(result.data).toEqual([]);
      });
    });
  });
});
