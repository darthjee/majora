import GameNpcsController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/GameNpcsController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('GameNpcsController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('reports an error when the DM-only NPC request returns a non-ok response', async function() {
    const setNpcs = jasmine.createSpy('setNpcs');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpcsAll']);

    client.currentHash.and.returnValue('#/games/demo/npcs');
    characterClient.fetchNpcsAll.and.returnValue(Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    }));
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ can_edit: true }));
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));
    AuthStorage.setToken('mytoken');

    const cleanup = new GameNpcsController(
      setNpcs, setPagination, setLoading, setError, client, characterClient, undefined,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setNpcs).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith('Unable to load NPCs.');

    cleanup();
  });

  it('reports an error when the DM-only NPC request rejects', async function() {
    const setNpcs = jasmine.createSpy('setNpcs');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpcsAll']);

    client.currentHash.and.returnValue('#/games/demo/npcs');
    characterClient.fetchNpcsAll.and.returnValue(Promise.reject(new Error('network error')));
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ can_edit: true }));
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));
    AuthStorage.setToken('mytoken');

    const cleanup = new GameNpcsController(
      setNpcs, setPagination, setLoading, setError, client, characterClient, undefined,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setNpcs).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith('Unable to load NPCs.');

    cleanup();
  });

  it('reports an error and defaults to the public NPC list when permission resolution rejects', async function() {
    const setNpcs = jasmine.createSpy('setNpcs');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpcsAll']);
    const publicNpcs = [{ id: 1 }];
    const pagination = { page: 1, pages: 1, perPage: 10 };

    client.currentHash.and.returnValue('#/games/demo/npcs');
    client.fetchIndex.and.returnValue(Promise.resolve({ data: publicNpcs, pagination }));
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.reject(new Error('network error')));
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('network error')));
    AuthStorage.setToken('mytoken');

    const cleanup = new GameNpcsController(
      setNpcs, setPagination, setLoading, setError, client, characterClient, undefined,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchNpcsAll).not.toHaveBeenCalled();
    expect(setNpcs).toHaveBeenCalledWith(publicNpcs);
    expect(setPagination).toHaveBeenCalledWith(pagination);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
