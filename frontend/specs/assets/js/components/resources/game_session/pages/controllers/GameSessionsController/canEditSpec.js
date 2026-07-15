import GameSessionsController
  from '../../../../../../../../../assets/js/components/resources/game_session/pages/controllers/GameSessionsController.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { buildClient } from './support.js';

describe('GameSessionsController', function() {
  it('sets canEdit to true when the game access response allows editing', async function() {
    const setColumns = jasmine.createSpy('setColumns');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setCanEdit = jasmine.createSpy('setCanEdit');
    const client = buildClient('#/games/demo/sessions');

    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

    const cleanup = new GameSessionsController(
      setColumns, setLoading, setError, client, setCanEdit,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setCanEdit).toHaveBeenCalledWith(true);

    cleanup();
  });

  it('sets canEdit to false when the access resolves with the fail-closed default', async function() {
    const setColumns = jasmine.createSpy('setColumns');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setCanEdit = jasmine.createSpy('setCanEdit');
    const client = buildClient('#/games/demo/sessions');

    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

    const cleanup = new GameSessionsController(
      setColumns, setLoading, setError, client, setCanEdit,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setCanEdit).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('sets canEdit to false when the access request throws', async function() {
    const setColumns = jasmine.createSpy('setColumns');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setCanEdit = jasmine.createSpy('setCanEdit');
    const client = buildClient('#/games/demo/sessions');

    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('network error')));

    const cleanup = new GameSessionsController(
      setColumns, setLoading, setError, client, setCanEdit,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setCanEdit).toHaveBeenCalledWith(false);

    cleanup();
  });
});
