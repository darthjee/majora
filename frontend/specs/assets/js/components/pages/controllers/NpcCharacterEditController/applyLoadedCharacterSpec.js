import NpcCharacterEditController
  from '../../../../../../../assets/js/components/pages/controllers/NpcCharacterEditController.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';

describe('NpcCharacterEditController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
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
        setRole: jasmine.createSpy('setRole'),
        setDescription: jasmine.createSpy('setDescription'),
        setPrivateDescription: jasmine.createSpy('setPrivateDescription'),
        setMoney: jasmine.createSpy('setMoney'),
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
      expect(setters.setRole).not.toHaveBeenCalled();
      expect(setters.setDescription).not.toHaveBeenCalled();
      expect(setters.setPrivateDescription).not.toHaveBeenCalled();
      expect(setters.setMoney).not.toHaveBeenCalled();
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
        role: 'Brute',
        public_description: 'Ruler of the cave',
        private_description: 'Secret',
        can_edit: true,
        money: 310,
      };

      controller.applyLoadedCharacter(character, 'demo', '2', setters);

      expect(setters.setName).toHaveBeenCalledWith('Goblin King');
      expect(setters.setRole).toHaveBeenCalledWith('Brute');
      expect(setters.setDescription).toHaveBeenCalledWith('Ruler of the cave');
      expect(setters.setPrivateDescription).toHaveBeenCalledWith('Secret');
      expect(setters.setMoney).toHaveBeenCalledWith('310');
    });
  });
});
