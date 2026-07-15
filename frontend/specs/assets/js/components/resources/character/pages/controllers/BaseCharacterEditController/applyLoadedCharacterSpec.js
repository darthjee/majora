import { TestCharacterEditController, buildContext } from './support.js';

describe('BaseCharacterEditController', function() {
  let setCharacter;
  let setLoading;
  let setError;
  let setFieldErrors;
  let client;
  let characterClient;

  beforeEach(function() {
    ({ setCharacter, setLoading, setError, setFieldErrors, client, characterClient } = buildContext());
  });

  describe('#applyLoadedCharacter', function() {
    let setters;

    beforeEach(function() {
      setters = {
        setName: jasmine.createSpy('setName'),
        setRole: jasmine.createSpy('setRole'),
        setDescription: jasmine.createSpy('setDescription'),
        setPrivateDescription: jasmine.createSpy('setPrivateDescription'),
        setMoney: jasmine.createSpy('setMoney'),
        setAllegiance: jasmine.createSpy('setAllegiance'),
        setPublicAllegiance: jasmine.createSpy('setPublicAllegiance'),
        setPublicSlain: jasmine.createSpy('setPublicSlain'),
        setHidden: jasmine.createSpy('setHidden'),
        setLinks: jasmine.createSpy('setLinks'),
      };
    });

    it('does nothing while the character has not loaded yet', function() {
      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
      );

      controller.applyLoadedCharacter(null, 'demo', '1', setters);

      expect(setters.setName).not.toHaveBeenCalled();
    });

    it('redirects to the show page when the loaded character cannot be edited and access has resolved', function() {
      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        controller.applyLoadedCharacter(
          { id: 1, can_edit: false, access_resolved: true }, 'demo', '1', setters,
        );

        expect(fakeWindow.location.hash).toBe('/games/demo/npcs/1');
        expect(setters.setName).not.toHaveBeenCalled();
      } finally {
        delete globalThis.window;
      }
    });

    it('does not redirect when the character cannot be edited but access has not resolved yet', function() {
      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        controller.applyLoadedCharacter(
          { id: 1, can_edit: false, access_resolved: false }, 'demo', '1', setters,
        );

        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });

    it('does not redirect when the character cannot be edited and access_resolved is absent', function() {
      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        controller.applyLoadedCharacter({ id: 1, can_edit: false }, 'demo', '1', setters);

        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });

    it('does not redirect when the character cannot be edited but is a player of the game', function() {
      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        controller.applyLoadedCharacter(
          {
            id: 1, can_edit: false, access_resolved: true, is_player: true,
          },
          'demo', '1', setters,
        );

        expect(fakeWindow.location.hash).toBe('');
        expect(setters.setName).toHaveBeenCalled();
      } finally {
        delete globalThis.window;
      }
    });

    it('seeds the form fields when the loaded character can be edited', function() {
      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
      );
      const links = [{ id: 12, text: 'Loot table', url: 'https://example.com/loot', link_type: 'lootstudio' }];
      const character = {
        id: 1, name: 'Test Hero',
        role: 'Fighter',
        public_description: 'A brave hero', private_description: 'DM notes', can_edit: true,
        money: 310,
        allegiance: 'ally',
        public_allegiance: 'enemy',
        public_slain: true,
        hidden: true,
        links,
      };

      controller.applyLoadedCharacter(character, 'demo', '1', setters);

      expect(setters.setName).toHaveBeenCalledWith('Test Hero');
      expect(setters.setRole).toHaveBeenCalledWith('Fighter');
      expect(setters.setDescription).toHaveBeenCalledWith('A brave hero');
      expect(setters.setPrivateDescription).toHaveBeenCalledWith('DM notes');
      expect(setters.setMoney).toHaveBeenCalledWith('310');
      expect(setters.setAllegiance).toHaveBeenCalledWith('ally');
      expect(setters.setPublicAllegiance).toHaveBeenCalledWith('enemy');
      expect(setters.setPublicSlain).toHaveBeenCalledWith(true);
      expect(setters.setHidden).toHaveBeenCalledWith(true);
      expect(setters.setLinks).toHaveBeenCalledWith(links);
    });

    it('defaults missing fields to empty strings and money to "0"', function() {
      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
      );

      controller.applyLoadedCharacter({ id: 1, can_edit: true }, 'demo', '1', setters);

      expect(setters.setName).toHaveBeenCalledWith('');
      expect(setters.setRole).toHaveBeenCalledWith('');
      expect(setters.setDescription).toHaveBeenCalledWith('');
      expect(setters.setPrivateDescription).toHaveBeenCalledWith('');
      expect(setters.setMoney).toHaveBeenCalledWith('0');
      expect(setters.setAllegiance).toHaveBeenCalledWith('neutral');
      expect(setters.setPublicAllegiance).toHaveBeenCalledWith('neutral');
      expect(setters.setPublicSlain).toHaveBeenCalledWith(false);
      expect(setters.setHidden).toHaveBeenCalledWith(false);
      expect(setters.setLinks).toHaveBeenCalledWith([]);
    });

    it('falls back public_allegiance/public_slain to the plain-detail keys for a player-only editor', function() {
      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
      );
      const character = {
        id: 1, can_edit: false, is_player: true, access_resolved: true,
        allegiance: 'enemy', slain: true,
      };

      controller.applyLoadedCharacter(character, 'demo', '1', setters);

      expect(setters.setAllegiance).toHaveBeenCalledWith('enemy');
      expect(setters.setPublicAllegiance).toHaveBeenCalledWith('enemy');
      expect(setters.setPublicSlain).toHaveBeenCalledWith(true);
    });
  });
});
