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
      };
    });

    it('does nothing while the character has not loaded yet', function() {
      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
      );

      controller.applyLoadedCharacter(null, 'demo', '1', setters);

      expect(setters.setName).not.toHaveBeenCalled();
    });

    it('redirects to the show page when the loaded character cannot be edited', function() {
      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        controller.applyLoadedCharacter({ id: 1, can_edit: false }, 'demo', '1', setters);

        expect(fakeWindow.location.hash).toBe('/games/demo/npcs/1');
        expect(setters.setName).not.toHaveBeenCalled();
      } finally {
        delete globalThis.window;
      }
    });

    it('seeds the form fields when the loaded character can be edited', function() {
      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
      );
      const character = {
        id: 1, name: 'Test Hero',
        role: 'Fighter',
        public_description: 'A brave hero', private_description: 'DM notes', can_edit: true,
        money: 310,
      };

      controller.applyLoadedCharacter(character, 'demo', '1', setters);

      expect(setters.setName).toHaveBeenCalledWith('Test Hero');
      expect(setters.setRole).toHaveBeenCalledWith('Fighter');
      expect(setters.setDescription).toHaveBeenCalledWith('A brave hero');
      expect(setters.setPrivateDescription).toHaveBeenCalledWith('DM notes');
      expect(setters.setMoney).toHaveBeenCalledWith('310');
    });
  });
});
