import fetchRequestStoreList, { buildListQuery }
  from '../../../../../../assets/js/components/common/list_types/fetchRequestStoreList.js';
import RequestStore from '../../../../../../assets/js/utils/requests/RequestStore.js';

describe('fetchRequestStoreList', function() {
  afterEach(function() {
    RequestStore.reset();
  });

  it('fetches through RequestStore.ensure and wraps the result with a fixed canEdit', async function() {
    spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
      data: [{ id: 1, name: 'Goblin' }],
      pagination: { page: 1, pages: 1, perPage: 10 },
    }));

    const result = await fetchRequestStoreList({
      resource: 'npc', params: { gameSlug: 'demo' }, query: { page: 2 }, canEdit: false,
    });

    expect(RequestStore.ensure).toHaveBeenCalledWith({
      resource: 'npc', quantityType: 'collection', params: { gameSlug: 'demo' }, query: { page: 2 },
    });
    expect(result).toEqual({
      data: [{ id: 1, name: 'Goblin' }],
      pagination: { page: 1, pages: 1, perPage: 10 },
      canEdit: false,
    });
  });

  it('defaults to an empty array when the response data is not an array', async function() {
    spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
      data: null, pagination: { page: 1, pages: 1, perPage: 10 },
    }));

    const result = await fetchRequestStoreList({ resource: 'npc', params: { gameSlug: 'demo' } });

    expect(result.data).toEqual([]);
  });

  it('defaults query to an empty object when omitted', async function() {
    spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
      data: [], pagination: { page: 1, pages: 1, perPage: 10 },
    }));

    await fetchRequestStoreList({ resource: 'npc', params: { gameSlug: 'demo' } });

    expect(RequestStore.ensure).toHaveBeenCalledWith({
      resource: 'npc', quantityType: 'collection', params: { gameSlug: 'demo' }, query: {},
    });
  });

  it('resolves canEdit true from a granted permissions promise', async function() {
    spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
      data: [], pagination: { page: 1, pages: 1, perPage: 10 },
    }));

    const result = await fetchRequestStoreList({
      resource: 'npc', params: { gameSlug: 'demo' }, canEdit: Promise.resolve({ can_edit: true }),
    });

    expect(result.canEdit).toBe(true);
  });

  it('resolves canEdit false from a denied permissions promise', async function() {
    spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
      data: [], pagination: { page: 1, pages: 1, perPage: 10 },
    }));

    const result = await fetchRequestStoreList({
      resource: 'npc', params: { gameSlug: 'demo' }, canEdit: Promise.resolve({ can_edit: false }),
    });

    expect(result.canEdit).toBe(false);
  });

  it('fails closed to canEdit false when the permissions promise rejects', async function() {
    spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
      data: [], pagination: { page: 1, pages: 1, perPage: 10 },
    }));

    const result = await fetchRequestStoreList({
      resource: 'npc', params: { gameSlug: 'demo' }, canEdit: Promise.reject(new Error('nope')),
    });

    expect(result.canEdit).toBe(false);
  });
});

describe('buildListQuery', function() {
  function fakeHashResolver(pagination) {
    return { getPaginationParams: () => new URLSearchParams(pagination) };
  }

  it('builds a query object from the resolver pagination params alone', function() {
    const hashResolver = fakeHashResolver({ page: '2', per_page: '5' });

    expect(buildListQuery(hashResolver)).toEqual({ page: '2', per_page: '5' });
  });

  it('merges extra params over the pagination params', function() {
    const hashResolver = fakeHashResolver({ page: '2' });

    expect(buildListQuery(hashResolver, { name: 'gob' })).toEqual({ page: '2', name: 'gob' });
  });

  it('returns an empty object when neither pagination nor extra params are present', function() {
    const hashResolver = fakeHashResolver({});

    expect(buildListQuery(hashResolver)).toEqual({});
  });
});
