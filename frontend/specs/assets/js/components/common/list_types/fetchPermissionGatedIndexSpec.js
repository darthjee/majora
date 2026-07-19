import fetchPermissionGatedIndex
  from '../../../../../../assets/js/components/common/list_types/fetchPermissionGatedIndex.js';

describe('fetchPermissionGatedIndex', function() {
  it('fetches the /all.json endpoint when the requester can edit', async function() {
    const client = jasmine.createSpyObj('client', ['fetchIndex']);

    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1, name: 'Goblin' }],
      pagination: { page: 1, pages: 1, perPage: 10 },
    }));

    const result = await fetchPermissionGatedIndex(
      Promise.resolve({ can_edit: true }), '/games/demo/npcs', {}, client,
    );

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs/all.json', {});
    expect(result.data).toEqual([{ id: 1, name: 'Goblin' }]);
    expect(result.canEdit).toBe(true);
  });

  it('fetches the plain endpoint when the requester cannot edit', async function() {
    const client = jasmine.createSpyObj('client', ['fetchIndex']);

    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [], pagination: { page: 1, pages: 1, perPage: 10 },
    }));

    const result = await fetchPermissionGatedIndex(
      Promise.resolve({ can_edit: false }), '/games/demo/npcs', {}, client,
    );

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs.json', {});
    expect(result.canEdit).toBe(false);
  });

  it('defaults to the plain endpoint when the permission check fails', async function() {
    const client = jasmine.createSpyObj('client', ['fetchIndex']);

    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [], pagination: { page: 1, pages: 1, perPage: 10 },
    }));

    const result = await fetchPermissionGatedIndex(
      Promise.reject(new Error('nope')), '/games/demo/npcs', {}, client,
    );

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs.json', {});
    expect(result.canEdit).toBe(false);
  });

  it('defaults to an empty array when the response data is not an array', async function() {
    const client = jasmine.createSpyObj('client', ['fetchIndex']);

    client.fetchIndex.and.returnValue(Promise.resolve({
      data: null, pagination: { page: 1, pages: 1, perPage: 10 },
    }));

    const result = await fetchPermissionGatedIndex(
      Promise.resolve({ can_edit: false }), '/games/demo/npcs', {}, client,
    );

    expect(result.data).toEqual([]);
  });

  it('forwards the given filter params to the fetch', async function() {
    const client = jasmine.createSpyObj('client', ['fetchIndex']);

    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [], pagination: { page: 1, pages: 1, perPage: 10 },
    }));

    await fetchPermissionGatedIndex(
      Promise.resolve({ can_edit: false }), '/games/demo/npcs', { name: 'gob' }, client,
    );

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs.json', { name: 'gob' });
  });
});
