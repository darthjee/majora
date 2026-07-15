import GameSessionsController
  from '../../../../../../../../../assets/js/components/resources/game_session/pages/controllers/GameSessionsController.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { buildClient } from './support.js';

describe('GameSessionsController', function() {
  it('sets error when any column fetch fails', async function() {
    const setColumns = jasmine.createSpy('setColumns');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setCanEdit = jasmine.createSpy('setCanEdit');
    const client = buildClient('#/games/demo/sessions', () => Promise.reject(new Error('network error')));

    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

    const cleanup = new GameSessionsController(
      setColumns, setLoading, setError, client, setCanEdit,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setError).toHaveBeenCalledWith('Unable to load sessions.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('sets error without fetching when slug is missing', async function() {
    const setColumns = jasmine.createSpy('setColumns');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setCanEdit = jasmine.createSpy('setCanEdit');
    const client = buildClient('#/games');

    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

    const cleanup = new GameSessionsController(
      setColumns, setLoading, setError, client, setCanEdit,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).not.toHaveBeenCalled();
    expect(AccessStore.ensureGamePermissions).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith('Unable to load sessions.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });
});
