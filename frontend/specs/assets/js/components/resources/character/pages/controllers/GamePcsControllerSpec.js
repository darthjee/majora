import GamePcsController
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/GamePcsController.js';

describe('GamePcsController', function() {
  it('extracts game slug from pcs hash', function() {
    expect(GamePcsController.getGameSlugFromPcsHash('#/games/demo/pcs')).toBe('demo');
  });

  it('uses route params to request game pcs', async function() {
    const setPcs = jasmine.createSpy('setPcs');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/pcs');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1 }],
      pagination: { page: 2, pages: 3, perPage: 4 },
    }));

    const cleanup = new GamePcsController(
      setPcs,
      setPagination,
      setLoading,
      setError,
      client,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/pcs.json');
    expect(setPcs).toHaveBeenCalledWith([{ id: 1 }]);
    expect(setPagination).toHaveBeenCalledWith({ page: 2, pages: 3, perPage: 4 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
