import GameTreasuresController, { getGameSlugFromTreasuresHash }
  from '../../../../../../assets/js/components/pages/controllers/GameTreasuresController.js';

describe('GameTreasuresController', function() {
  it('extracts game slug from treasures hash', function() {
    expect(getGameSlugFromTreasuresHash('#/games/demo/treasures')).toBe('demo');
  });

  it('returns empty string when hash does not match treasures route', function() {
    expect(getGameSlugFromTreasuresHash('#/games/demo')).toBe('');
  });

  it('uses route params to request game treasures', async function() {
    const setTreasures = jasmine.createSpy('setTreasures');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/treasures');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1, name: 'Sword', value: 100 }],
      pagination: { page: 2, pages: 3, perPage: 4 },
    }));

    const cleanup = new GameTreasuresController(
      setTreasures,
      setPagination,
      setLoading,
      setError,
      client,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/treasures.json');
    expect(setTreasures).toHaveBeenCalledWith([{ id: 1, name: 'Sword', value: 100 }]);
    expect(setPagination).toHaveBeenCalledWith({ page: 2, pages: 3, perPage: 4 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('sets error when fetch fails', async function() {
    const setTreasures = jasmine.createSpy('setTreasures');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/treasures');
    client.fetchIndex.and.returnValue(Promise.reject(new Error('network error')));

    const cleanup = new GameTreasuresController(
      setTreasures,
      setPagination,
      setLoading,
      setError,
      client,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setError).toHaveBeenCalledWith('Unable to load treasures.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('sets error without fetching when slug is missing', async function() {
    const setTreasures = jasmine.createSpy('setTreasures');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games');

    const cleanup = new GameTreasuresController(
      setTreasures,
      setPagination,
      setLoading,
      setError,
      client,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith('Unable to load treasures.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('does not update state after unmount', async function() {
    const setTreasures = jasmine.createSpy('setTreasures');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/treasures');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1, name: 'Sword', value: 100 }],
      pagination: { page: 1, pages: 1, perPage: 10 },
    }));

    const cleanup = new GameTreasuresController(
      setTreasures,
      setPagination,
      setLoading,
      setError,
      client,
    ).buildEffect()();

    cleanup();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setTreasures).not.toHaveBeenCalled();
    expect(setPagination).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
  });
});
