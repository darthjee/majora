import GameTreasuresController
  from '../../../../../../../assets/js/components/pages/controllers/GameTreasuresController.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';

describe('GameTreasuresController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('does not update state after unmount', async function() {
    const setTreasures = jasmine.createSpy('setTreasures');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setCanEdit = jasmine.createSpy('setCanEdit');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);

    client.currentHash.and.returnValue('#/games/demo/treasures');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1, name: 'Sword', value: 100 }],
      pagination: { page: 1, pages: 1, perPage: 10 },
    }));
    gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: false }),
    }));

    const cleanup = new GameTreasuresController(
      setTreasures,
      setPagination,
      setLoading,
      setError,
      client,
      setCanEdit,
      gameClient,
    ).buildEffect()();

    cleanup();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setTreasures).not.toHaveBeenCalled();
    expect(setPagination).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
    expect(setCanEdit).not.toHaveBeenCalled();
  });
});
