import NpcCharacterTreasuresController, { getNpcCharacterTreasuresParamsFromHash }
  from '../../../../../../assets/js/components/pages/controllers/NpcCharacterTreasuresController.js';

describe('NpcCharacterTreasuresController', function() {
  const buildCharacterClient = (overrides = {}) => {
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpc', 'fetchNpcAccess']);

    characterClient.fetchNpc.and.returnValue(Promise.resolve({ ok: false }));
    characterClient.fetchNpcAccess.and.returnValue(Promise.resolve({ ok: false }));

    return Object.assign(characterClient, overrides);
  };

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
      setTreasures, setPagination, setLoading, setError, client, undefined, buildCharacterClient(),
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
      setTreasures, setPagination, setLoading, setError, client, undefined, buildCharacterClient(),
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
      setTreasures, setPagination, setLoading, setError, client, undefined, buildCharacterClient(),
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
      setTreasures, setPagination, setLoading, setError, client, undefined, buildCharacterClient(),
    ).buildEffect()();

    cleanup();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setTreasures).not.toHaveBeenCalled();
    expect(setPagination).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
  });

  describe('character context', function() {
    const buildClient = () => {
      const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

      client.currentHash.and.returnValue('#/games/demo/npcs/2/treasures');
      client.fetchIndex.and.returnValue(Promise.resolve({
        data: [],
        pagination: { page: 1, pages: 1, perPage: 10 },
      }));

      return client;
    };

    it('merges can_edit from the access endpoint onto the fetched character', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const characterClient = buildCharacterClient();

      characterClient.fetchNpc.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 2, game_slug: 'demo', is_pc: false, money: 120 }),
      }));
      characterClient.fetchNpcAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: true }),
      }));

      const cleanup = new NpcCharacterTreasuresController(
        jasmine.createSpy('setTreasures'),
        jasmine.createSpy('setPagination'),
        jasmine.createSpy('setLoading'),
        jasmine.createSpy('setError'),
        buildClient(),
        setCharacter,
        characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCharacter).toHaveBeenCalledWith({
        id: 2, game_slug: 'demo', is_pc: false, money: 120, can_edit: true,
      });

      cleanup();
    });

    it('sets the character to null when the base fetch fails', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const characterClient = buildCharacterClient();

      characterClient.fetchNpc.and.returnValue(Promise.resolve({ ok: false }));

      const cleanup = new NpcCharacterTreasuresController(
        jasmine.createSpy('setTreasures'),
        jasmine.createSpy('setPagination'),
        jasmine.createSpy('setLoading'),
        jasmine.createSpy('setError'),
        buildClient(),
        setCharacter,
        characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCharacter).toHaveBeenCalledWith(null);

      cleanup();
    });

    it('falls back to the base character with can_edit false when the access fetch fails', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const characterClient = buildCharacterClient();

      characterClient.fetchNpc.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 2, game_slug: 'demo', is_pc: false, money: 120 }),
      }));
      characterClient.fetchNpcAccess.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new NpcCharacterTreasuresController(
        jasmine.createSpy('setTreasures'),
        jasmine.createSpy('setPagination'),
        jasmine.createSpy('setLoading'),
        jasmine.createSpy('setError'),
        buildClient(),
        setCharacter,
        characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCharacter).toHaveBeenCalledWith({ id: 2, game_slug: 'demo', is_pc: false, money: 120 });

      cleanup();
    });
  });
});
