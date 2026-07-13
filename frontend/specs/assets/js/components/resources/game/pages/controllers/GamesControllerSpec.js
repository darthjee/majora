import GamesController from '../../../../../../../../assets/js/components/resources/game/pages/controllers/GamesController.js';

describe('GamesController', function() {
  it('fetches games and pagination', async function() {
    const setGames = jasmine.createSpy('setGames');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['fetchIndex']);
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1 }],
      pagination: { page: 1, pages: 1, perPage: 10 },
    }));

    const cleanup = new GamesController(setGames, setPagination, setLoading, setError, client).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/games.json');
    expect(setGames).toHaveBeenCalledWith([{ id: 1 }]);
    expect(setPagination).toHaveBeenCalledWith({ page: 1, pages: 1, perPage: 10 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
