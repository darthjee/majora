import NpcCharacterEditController, { getNpcCharacterEditParamsFromHash, resolveLoadedCharacter }
  from '../../../../../../assets/js/components/pages/controllers/NpcCharacterEditController.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';

describe('NpcCharacterEditController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('extracts character params from an edit hash', function() {
    expect(getNpcCharacterEditParamsFromHash('#/games/demo/npcs/1/edit')).toEqual({
      game_slug: 'demo',
      character_id: '1',
    });
  });

  describe('resolveLoadedCharacter', function() {
    it('neither redirects nor seeds fields while the character has not loaded yet', function() {
      expect(resolveLoadedCharacter(null)).toEqual({ redirect: false, fields: null });
    });

    it('redirects when the loaded character cannot be edited', function() {
      expect(resolveLoadedCharacter({ id: 1, can_edit: false })).toEqual({
        redirect: true,
        fields: null,
      });
    });

    it('returns seed fields when the loaded character can be edited', function() {
      const character = {
        id: 1,
        name: 'Goblin King',
        avatar_url: 'http://example.com/a.png',
        character_class: 'Brute',
        level: 5,
        description: 'Ruler of the cave',
        can_edit: true,
      };

      expect(resolveLoadedCharacter(character)).toEqual({
        redirect: false,
        fields: {
          name: 'Goblin King',
          avatar_url: 'http://example.com/a.png',
          character_class: 'Brute',
          level: 5,
          description: 'Ruler of the cave',
        },
      });
    });

    it('defaults missing fields to empty strings', function() {
      expect(resolveLoadedCharacter({ id: 1, can_edit: true })).toEqual({
        redirect: false,
        fields: {
          name: '',
          avatar_url: '',
          character_class: '',
          level: '',
          description: '',
        },
      });
    });
  });

  describe('#applyLoadedCharacter', function() {
    let setCharacter;
    let setLoading;
    let setError;
    let setFieldErrors;
    let setters;

    beforeEach(function() {
      setCharacter = jasmine.createSpy('setCharacter');
      setLoading = jasmine.createSpy('setLoading');
      setError = jasmine.createSpy('setError');
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setters = {
        setName: jasmine.createSpy('setName'),
        setAvatarUrl: jasmine.createSpy('setAvatarUrl'),
        setCharacterClass: jasmine.createSpy('setCharacterClass'),
        setLevel: jasmine.createSpy('setLevel'),
        setDescription: jasmine.createSpy('setDescription'),
      };
    });

    it('does nothing while the character has not loaded yet', function() {
      const controller = new NpcCharacterEditController(
        setCharacter,
        setLoading,
        setError,
        setFieldErrors,
      );

      controller.applyLoadedCharacter(null, 'demo', '2', setters);

      expect(setters.setName).not.toHaveBeenCalled();
      expect(setters.setAvatarUrl).not.toHaveBeenCalled();
      expect(setters.setCharacterClass).not.toHaveBeenCalled();
      expect(setters.setLevel).not.toHaveBeenCalled();
      expect(setters.setDescription).not.toHaveBeenCalled();
    });

    it('redirects to the show page when the loaded character cannot be edited', function() {
      const controller = new NpcCharacterEditController(
        setCharacter,
        setLoading,
        setError,
        setFieldErrors,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        controller.applyLoadedCharacter({ id: 1, can_edit: false }, 'demo', '2', setters);

        expect(fakeWindow.location.hash).toBe('/games/demo/npcs/2');
        expect(setters.setName).not.toHaveBeenCalled();
      } finally {
        delete globalThis.window;
      }
    });

    it('seeds the form fields when the loaded character can be edited', function() {
      const controller = new NpcCharacterEditController(
        setCharacter,
        setLoading,
        setError,
        setFieldErrors,
      );
      const character = {
        id: 1,
        name: 'Goblin King',
        avatar_url: 'http://example.com/a.png',
        character_class: 'Brute',
        level: 5,
        description: 'Ruler of the cave',
        can_edit: true,
      };

      controller.applyLoadedCharacter(character, 'demo', '2', setters);

      expect(setters.setName).toHaveBeenCalledWith('Goblin King');
      expect(setters.setAvatarUrl).toHaveBeenCalledWith('http://example.com/a.png');
      expect(setters.setCharacterClass).toHaveBeenCalledWith('Brute');
      expect(setters.setLevel).toHaveBeenCalledWith(5);
      expect(setters.setDescription).toHaveBeenCalledWith('Ruler of the cave');
    });
  });

  describe('#buildEffect', function() {
    it('requests the character detail using the edit route params', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash']);
      const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpc', 'updateNpc']);

      client.currentHash.and.returnValue('#/games/demo/npcs/2/edit');
      characterClient.fetchNpc.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 2, can_edit: true }),
      }));

      const controller = new NpcCharacterEditController(
        setCharacter,
        setLoading,
        setError,
        () => {},
        client,
        characterClient,
      );
      const cleanup = controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(characterClient.fetchNpc).toHaveBeenCalledWith('demo', '2', null);
      expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: true });

      cleanup();
    });
  });

});
