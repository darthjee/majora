import GameNpcsController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/GameNpcsController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('GameNpcsController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('forwards the current page/per_page to the DM-only NPC request when can_edit is true', async function() {
    const setNpcs = jasmine.createSpy('setNpcs');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpcsAll']);
    const authNpcs = [{ id: 10, name: 'Hidden NPC' }];
    const authHeaders = { page: '2', pages: '4', per_page: '16' };

    client.currentHash.and.returnValue('#/games/demo/npcs?page=2&per_page=16');
    characterClient.fetchNpcsAll.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve(authNpcs),
      headers: { get: (key) => authHeaders[key] ?? null },
    }));
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ can_edit: true }));
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));
    AuthStorage.setToken('mytoken');

    const cleanup = new GameNpcsController(
      setNpcs, setPagination, setLoading, setError, client, characterClient, undefined,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchNpcsAll).toHaveBeenCalledWith('demo', 'mytoken', { page: '2', per_page: '16' });
    expect(setPagination).toHaveBeenCalledWith({ page: 2, pages: 4, perPage: 16 });
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('forwards active slain/name filters to the public NPC request when can_edit is false', async function() {
    const setNpcs = jasmine.createSpy('setNpcs');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpcsAll']);
    const publicNpcs = [{ id: 1 }];
    const pagination = { page: 1, pages: 1, perPage: 10 };

    client.currentHash.and.returnValue('#/games/demo/npcs?slain=true&name=gob');
    client.fetchIndex.and.returnValue(Promise.resolve({ data: publicNpcs, pagination }));
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ can_edit: false }));
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

    const cleanup = new GameNpcsController(
      setNpcs, setPagination, setLoading, setError, client, characterClient, undefined,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs.json', { slain: 'true', name: 'gob' });
    expect(characterClient.fetchNpcsAll).not.toHaveBeenCalled();
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('forwards active slain/name filters to the DM-only NPC request when can_edit is true', async function() {
    const setNpcs = jasmine.createSpy('setNpcs');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpcsAll']);
    const authNpcs = [{ id: 10, name: 'Hidden NPC' }];
    const authHeaders = { page: '1', pages: '1', per_page: '10' };

    client.currentHash.and.returnValue('#/games/demo/npcs?slain=true&name=gob');
    characterClient.fetchNpcsAll.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve(authNpcs),
      headers: { get: (key) => authHeaders[key] ?? null },
    }));
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ can_edit: true }));
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));
    AuthStorage.setToken('mytoken');

    const cleanup = new GameNpcsController(
      setNpcs, setPagination, setLoading, setError, client, characterClient, undefined,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchNpcsAll).toHaveBeenCalledWith(
      'demo', 'mytoken', { slain: 'true', name: 'gob' },
    );
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
