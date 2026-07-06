import GameSessionsController
  from '../../../../../../../assets/js/components/pages/controllers/GameSessionsController.js';

describe('GameSessionsController', function() {
  it('uses route params to request game sessions', async function() {
    const setSessions = jasmine.createSpy('setSessions');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setCanEdit = jasmine.createSpy('setCanEdit');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);

    client.currentHash.and.returnValue('#/games/demo/sessions');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1, title: 'Session 1', date: '2024-01-01', game_slug: 'demo' }],
      pagination: { page: 2, pages: 3, perPage: 4 },
    }));
    gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: false }),
    }));

    const cleanup = new GameSessionsController(
      setSessions,
      setPagination,
      setLoading,
      setError,
      client,
      setCanEdit,
      gameClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/sessions.json');
    expect(setSessions).toHaveBeenCalledWith(
      [{ id: 1, title: 'Session 1', date: '2024-01-01', game_slug: 'demo' }],
    );
    expect(setPagination).toHaveBeenCalledWith({ page: 2, pages: 3, perPage: 4 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
