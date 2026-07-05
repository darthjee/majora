import NpcCharacterTreasuresController, { getNpcCharacterTreasuresParamsFromHash }
  from '../../../../../../assets/js/components/pages/controllers/NpcCharacterTreasuresController.js';

describe('NpcCharacterTreasuresController', function() {
  it('extracts game slug and character id from treasures hash', function() {
    expect(getNpcCharacterTreasuresParamsFromHash('#/games/demo/npcs/2/treasures')).toEqual({
      game_slug: 'demo',
      character_id: '2',
    });
  });

  it('returns empty strings when hash does not match the treasures route', function() {
    expect(getNpcCharacterTreasuresParamsFromHash('#/games/demo/npcs/2')).toEqual({
      game_slug: '',
      character_id: '',
    });
  });

  it('uses route params to request npc character treasures', async function() {
    const setTreasures = jasmine.createSpy('setTreasures');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/npcs/2/treasures');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1, name: 'Sword', quantity: 1, value: 100 }],
      pagination: { page: 2, pages: 3, perPage: 4 },
    }));

    const cleanup = new NpcCharacterTreasuresController(
      setTreasures, setPagination, setLoading, setError, client,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs/2/treasures.json');
    expect(setTreasures).toHaveBeenCalledWith([{ id: 1, name: 'Sword', quantity: 1, value: 100 }]);
    expect(setPagination).toHaveBeenCalledWith({ page: 2, pages: 3, perPage: 4 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('sets an error when the fetch fails', async function() {
    const setTreasures = jasmine.createSpy('setTreasures');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/npcs/2/treasures');
    client.fetchIndex.and.returnValue(Promise.reject(new Error('network error')));

    const cleanup = new NpcCharacterTreasuresController(
      setTreasures, setPagination, setLoading, setError, client,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setError).toHaveBeenCalledWith('Unable to load treasures.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('sets an error without fetching when params are missing', async function() {
    const setTreasures = jasmine.createSpy('setTreasures');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/other');

    const cleanup = new NpcCharacterTreasuresController(
      setTreasures, setPagination, setLoading, setError, client,
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

    client.currentHash.and.returnValue('#/games/demo/npcs/2/treasures');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1, name: 'Sword', quantity: 1, value: 100 }],
      pagination: { page: 1, pages: 1, perPage: 10 },
    }));

    const cleanup = new NpcCharacterTreasuresController(
      setTreasures, setPagination, setLoading, setError, client,
    ).buildEffect()();

    cleanup();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setTreasures).not.toHaveBeenCalled();
    expect(setPagination).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
  });
});
