import listTypeConfig from '../../../../../../../assets/js/components/common/list_types/listTypeConfig.js';
import StlModelListItem from '../../../../../../../assets/js/components/common/list_types/StlModelListItem.js';
import StlModelFilters from '../../../../../../../assets/js/components/resources/stl_model/pages/elements/StlModelFilters.jsx';
import { groupFilterParams } from '../../../../../../../assets/js/components/common/list_types/configs/stlModelListType.js';
import { buildStlModel } from '../../../../../../support/factories.js';

describe('listTypeConfig', function() {
  describe('stlModels', function() {
    const { stlModels } = listTypeConfig;

    it('uses StlModelListItem as the wrapper class', function() {
      expect(stlModels.wrapperClass).toBe(StlModelListItem);
    });

    it('uses StlModelFilters as the filters component', function() {
      expect(stlModels.filtersComponent).toBe(StlModelFilters);
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
      it('fetches through GenericClient with no filter params', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const hashResolver = { getFilterParams: () => new URLSearchParams() };

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [buildStlModel()],
          pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        const result = await stlModels.fetchList(undefined, hashResolver, client);

        expect(client.fetchIndex).toHaveBeenCalledWith('/miniatures/stl_models.json', {});
        expect(result.data).toEqual([buildStlModel()]);
        expect(result.pagination).toEqual({ page: 1, pages: 1, perPage: 10 });
        expect(result.canEdit).toBe(false);
      });

      it('passes single-value filter params as scalars', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const hashResolver = {
          getFilterParams: () => new URLSearchParams({ name: 'gob', type: 'creature', size: 'small' }),
        };

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [], pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        await stlModels.fetchList(undefined, hashResolver, client);

        expect(client.fetchIndex).toHaveBeenCalledWith('/miniatures/stl_models.json', {
          name: 'gob', type: 'creature', size: 'small',
        });
      });

      it('passes multi-value filter params as arrays', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const params = new URLSearchParams();

        params.append('race', 'elf');
        params.append('race', 'orc');
        params.append('tags', 'painted');
        params.append('tags', 'resin');

        const hashResolver = { getFilterParams: () => params };

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [], pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        await stlModels.fetchList(undefined, hashResolver, client);

        expect(client.fetchIndex).toHaveBeenCalledWith('/miniatures/stl_models.json', {
          race: ['elf', 'orc'], tags: ['painted', 'resin'],
        });
      });

      it('defaults to an empty array when the response data is not an array', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const hashResolver = { getFilterParams: () => new URLSearchParams() };

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: null, pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        const result = await stlModels.fetchList(undefined, hashResolver, client);

        expect(result.data).toEqual([]);
      });
    });
  });
});

describe('groupFilterParams', function() {
  it('groups a single value for a key as a scalar', function() {
    expect(groupFilterParams(new URLSearchParams({ name: 'gob' }))).toEqual({ name: 'gob' });
  });

  it('groups repeated values for the same key into an array, in order', function() {
    const params = new URLSearchParams();

    params.append('race', 'elf');
    params.append('race', 'orc');

    expect(groupFilterParams(params)).toEqual({ race: ['elf', 'orc'] });
  });

  it('returns an empty object for empty params', function() {
    expect(groupFilterParams(new URLSearchParams())).toEqual({});
  });

  it('mixes scalar and array keys', function() {
    const params = new URLSearchParams();

    params.append('name', 'gob');
    params.append('race', 'elf');
    params.append('race', 'orc');

    expect(groupFilterParams(params)).toEqual({ name: 'gob', race: ['elf', 'orc'] });
  });
});
