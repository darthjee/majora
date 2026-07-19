import fetchWithEditableEndpoint from '../../../../../../../assets/js/components/common/list_types/configs/fetchWithEditableEndpoint.js';
import AccessStore from '../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('fetchWithEditableEndpoint', function() {
  it('fetches the /all.json endpoint when the requester can edit', async function() {
    const client = jasmine.createSpyObj('client', ['fetchIndex']);

    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1, name: 'Goblin' }],
      pagination: { page: 1, pages: 1, perPage: 10 },
    }));
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

    const result = await fetchWithEditableEndpoint('demo', '/games/demo/npcs', {}, client);

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs/all.json', {});
    expect(result.data).toEqual([{ id: 1, name: 'Goblin' }]);
    expect(result.canEdit).toBe(true);
  });

  it('fetches the plain endpoint when the requester cannot edit', async function() {
    const client = jasmine.createSpyObj('client', ['fetchIndex']);

    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [], pagination: { page: 1, pages: 1, perPage: 10 },
    }));
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

    const result = await fetchWithEditableEndpoint('demo', '/games/demo/npcs', {}, client);

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs.json', {});
    expect(result.canEdit).toBe(false);
  });

  it('defaults to the plain endpoint when the permission check fails', async function() {
    const client = jasmine.createSpyObj('client', ['fetchIndex']);

    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [], pagination: { page: 1, pages: 1, perPage: 10 },
    }));
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('nope')));

    const result = await fetchWithEditableEndpoint('demo', '/games/demo/npcs', {}, client);

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs.json', {});
    expect(result.canEdit).toBe(false);
  });

  it('defaults to an empty array when the response data is not an array', async function() {
    const client = jasmine.createSpyObj('client', ['fetchIndex']);

    client.fetchIndex.and.returnValue(Promise.resolve({
      data: null, pagination: { page: 1, pages: 1, perPage: 10 },
    }));
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

    const result = await fetchWithEditableEndpoint('demo', '/games/demo/npcs', {}, client);

    expect(result.data).toEqual([]);
  });

  it('forwards the given filter params to the fetch', async function() {
    const client = jasmine.createSpyObj('client', ['fetchIndex']);

    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [], pagination: { page: 1, pages: 1, perPage: 10 },
    }));
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

    await fetchWithEditableEndpoint('demo', '/games/demo/npcs', { name: 'gob' }, client);

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs.json', { name: 'gob' });
  });
});
