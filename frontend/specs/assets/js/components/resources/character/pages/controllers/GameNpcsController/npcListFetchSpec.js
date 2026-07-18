import GameNpcsController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/GameNpcsController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('GameNpcsController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('uses route params to request game npcs', async function() {
    const setNpcs = jasmine.createSpy('setNpcs');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/npcs');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1 }],
      pagination: { page: 2, pages: 3, perPage: 4 },
    }));
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ can_edit: false }));
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

    const cleanup = new GameNpcsController(
      setNpcs,
      setPagination,
      setLoading,
      setError,
      client,
      null,
      undefined,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs.json', {});
    expect(setNpcs).toHaveBeenCalledWith([{ id: 1 }]);
    expect(setPagination).toHaveBeenCalledWith({ page: 2, pages: 3, perPage: 4 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('fetches the player-scoped NPC list and skips the DM-only endpoint when can_edit is false', async function() {
    const setNpcs = jasmine.createSpy('setNpcs');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpcsAll']);
    const publicNpcs = [{ id: 1 }];
    const pagination = { page: 1, pages: 2, perPage: 10 };

    client.currentHash.and.returnValue('#/games/demo/npcs');
    client.fetchIndex.and.returnValue(Promise.resolve({ data: publicNpcs, pagination }));
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ can_edit: false }));
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

    const cleanup = new GameNpcsController(
      setNpcs, setPagination, setLoading, setError, client, characterClient, undefined,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchNpcsAll).not.toHaveBeenCalled();
    expect(setNpcs).toHaveBeenCalledWith(publicNpcs);
    expect(setPagination).toHaveBeenCalledWith(pagination);

    cleanup();
  });

  it('fetches the DM-only NPC list and skips the public endpoint when can_edit is true', async function() {
    const setNpcs = jasmine.createSpy('setNpcs');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpcsAll']);
    const authNpcs = [{ id: 10, name: 'Hidden NPC' }];
    const authHeaders = { page: '3', pages: '5', per_page: '20' };

    client.currentHash.and.returnValue('#/games/demo/npcs');
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

    expect(client.fetchIndex).not.toHaveBeenCalled();
    expect(characterClient.fetchNpcsAll).toHaveBeenCalledWith('demo', 'mytoken', {});
    expect(setNpcs).toHaveBeenCalledWith(authNpcs);
    expect(setPagination).toHaveBeenCalledWith({ page: 3, pages: 5, perPage: 20 });
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('fetches the player-scoped NPC list even with a stored token, when "View as" simulates a player', async function() {
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
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_player: true }));
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));
    AuthStorage.setToken('mytoken');

    const cleanup = new GameNpcsController(
      setNpcs, setPagination, setLoading, setError, client, characterClient, undefined,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs.json', {});
    expect(characterClient.fetchNpcsAll).not.toHaveBeenCalled();
    expect(setNpcs).toHaveBeenCalledWith(publicNpcs);
    expect(setPagination).toHaveBeenCalledWith(pagination);

    cleanup();
  });
});
