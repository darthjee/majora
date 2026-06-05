import CharacterController, { getCharacterParamsFromHash }
  from '../../../../../../assets/js/components/pages/controllers/CharacterController.js';

describe('CharacterController', function() {
  it('extracts character params from hash', function() {
    expect(getCharacterParamsFromHash('#/games/demo/characters/1')).toEqual({
      game_slug: 'demo',
      character_id: '1',
    });
  });

  it('uses route params to request character detail', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);

    client.currentHash.and.returnValue('#/games/demo/characters/2');
    client.fetch.and.returnValue(Promise.resolve({ id: 2 }));

    const cleanup = new CharacterController(
      setCharacter,
      setLoading,
      setError,
      client,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetch).toHaveBeenCalledWith('/games/demo/characters/2.json');
    expect(setCharacter).toHaveBeenCalledWith({ id: 2 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
