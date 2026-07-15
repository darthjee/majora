import GameSessionsController
  from '../../../../../../../../../assets/js/components/resources/game_session/pages/controllers/GameSessionsController.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { buildClient } from './support.js';

describe('GameSessionsController', function() {
  it('does not update state after unmount', async function() {
    const setColumns = jasmine.createSpy('setColumns');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setCanEdit = jasmine.createSpy('setCanEdit');
    const client = buildClient('#/games/demo/sessions');

    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

    const cleanup = new GameSessionsController(
      setColumns, setLoading, setError, client, setCanEdit,
    ).buildEffect()();

    cleanup();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setColumns).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
    expect(setCanEdit).not.toHaveBeenCalled();
  });
});
