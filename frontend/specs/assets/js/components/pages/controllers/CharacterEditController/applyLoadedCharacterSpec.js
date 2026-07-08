import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import { KINDS } from './support.js';

KINDS.forEach(({ label, Controller, kind, name, role, description }) => {
  describe(label, function() {
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
          setAllegiance: jasmine.createSpy('setAllegiance'),
          setPublicAllegiance: jasmine.createSpy('setPublicAllegiance'),
        };
      });

      it('does nothing while the character has not loaded yet', function() {
        const controller = new Controller(
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
        expect(setters.setAllegiance).not.toHaveBeenCalled();
        expect(setters.setPublicAllegiance).not.toHaveBeenCalled();
      });

      it('redirects to the show page when the loaded character cannot be edited', function() {
        const controller = new Controller(
          setCharacter,
          setLoading,
          setError,
          setFieldErrors,
        );
        const fakeWindow = { location: { hash: '' } };
        globalThis.window = fakeWindow;

        try {
          controller.applyLoadedCharacter({ id: 1, can_edit: false }, 'demo', '2', setters);

          expect(fakeWindow.location.hash).toBe(`/games/demo/${kind}/2`);
          expect(setters.setName).not.toHaveBeenCalled();
        } finally {
          delete globalThis.window;
        }
      });

      it('seeds the form fields when the loaded character can be edited', function() {
        const controller = new Controller(
          setCharacter,
          setLoading,
          setError,
          setFieldErrors,
        );
        const character = {
          id: 1,
          name,
          role,
          public_description: description,
          private_description: 'Secret',
          can_edit: true,
          money: 310,
          allegiance: 'ally',
          public_allegiance: 'enemy',
        };

        controller.applyLoadedCharacter(character, 'demo', '2', setters);

        expect(setters.setName).toHaveBeenCalledWith(name);
        expect(setters.setRole).toHaveBeenCalledWith(role);
        expect(setters.setDescription).toHaveBeenCalledWith(description);
        expect(setters.setPrivateDescription).toHaveBeenCalledWith('Secret');
        expect(setters.setMoney).toHaveBeenCalledWith('310');
        expect(setters.setAllegiance).toHaveBeenCalledWith('ally');
        expect(setters.setPublicAllegiance).toHaveBeenCalledWith('enemy');
      });

      it('defaults missing fields to empty strings and money to "0"', function() {
        const controller = new Controller(
          setCharacter,
          setLoading,
          setError,
          setFieldErrors,
        );

        controller.applyLoadedCharacter({ id: 1, can_edit: true }, 'demo', '2', setters);

        expect(setters.setName).toHaveBeenCalledWith('');
        expect(setters.setRole).toHaveBeenCalledWith('');
        expect(setters.setDescription).toHaveBeenCalledWith('');
        expect(setters.setPrivateDescription).toHaveBeenCalledWith('');
        expect(setters.setMoney).toHaveBeenCalledWith('0');
        expect(setters.setAllegiance).toHaveBeenCalledWith('neutral');
        expect(setters.setPublicAllegiance).toHaveBeenCalledWith('neutral');
      });
    });
  });
});
