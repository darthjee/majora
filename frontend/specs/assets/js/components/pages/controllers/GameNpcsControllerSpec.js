import GameNpcsController, { getGameSlugFromNpcsHash }
  from '../../../../../../assets/js/components/pages/controllers/GameNpcsController.js';

describe('GameNpcsController', function() {
  it('extracts game slug from npcs hash', function() {
    expect(getGameSlugFromNpcsHash('#/games/demo/npcs')).toBe('demo');
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

    const cleanup = new GameNpcsController(
      setNpcs,
      setPagination,
      setLoading,
      setError,
      client,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs.json');
    expect(setNpcs).toHaveBeenCalledWith([{ id: 1 }]);
    expect(setPagination).toHaveBeenCalledWith({ page: 2, pages: 3, perPage: 4 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
