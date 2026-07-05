import PcCharacterEditController, { getPcCharacterEditParamsFromHash, resolveLoadedCharacter }
  from '../../../../../../assets/js/components/pages/controllers/PcCharacterEditController.js';
import Noop from '../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';

describe('PcCharacterEditController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('extracts character params from an edit hash', function() {
    expect(getPcCharacterEditParamsFromHash('#/games/demo/pcs/1/edit')).toEqual({
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
        name: 'Aragorn',
        role: 'Ranger',
        public_description: 'King',
        private_description: 'Secret notes',
        can_edit: true,
        money: 310,
      };

      expect(resolveLoadedCharacter(character)).toEqual({
        redirect: false,
        fields: {
          name: 'Aragorn',
          role: 'Ranger',
          public_description: 'King',
          private_description: 'Secret notes',
          money: '310',
        },
      });
    });

    it('defaults missing fields to empty strings and money to "0"', function() {
      expect(resolveLoadedCharacter({ id: 1, can_edit: true })).toEqual({
        redirect: false,
        fields: {
          name: '',
          role: '',
          public_description: '',
          private_description: '',
          money: '0',
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
        setRole: jasmine.createSpy('setRole'),
        setDescription: jasmine.createSpy('setDescription'),
        setPrivateDescription: jasmine.createSpy('setPrivateDescription'),
        setMoney: jasmine.createSpy('setMoney'),
      };
    });

    it('does nothing while the character has not loaded yet', function() {
      const controller = new PcCharacterEditController(
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
      const controller = new PcCharacterEditController(
        setCharacter,
        setLoading,
        setError,
        setFieldErrors,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        controller.applyLoadedCharacter({ id: 1, can_edit: false }, 'demo', '2', setters);

        expect(fakeWindow.location.hash).toBe('/games/demo/pcs/2');
        expect(setters.setName).not.toHaveBeenCalled();
      } finally {
        delete globalThis.window;
      }
    });

    it('seeds the form fields when the loaded character can be edited', function() {
      const controller = new PcCharacterEditController(
        setCharacter,
        setLoading,
        setError,
        setFieldErrors,
      );
      const character = {
        id: 1,
        name: 'Aragorn',
        role: 'Ranger',
        public_description: 'King',
        private_description: 'Secret',
        can_edit: true,
        money: 310,
      };

      controller.applyLoadedCharacter(character, 'demo', '2', setters);

      expect(setters.setName).toHaveBeenCalledWith('Aragorn');
      expect(setters.setRole).toHaveBeenCalledWith('Ranger');
      expect(setters.setDescription).toHaveBeenCalledWith('King');
      expect(setters.setPrivateDescription).toHaveBeenCalledWith('Secret');
      expect(setters.setMoney).toHaveBeenCalledWith('310');
    });
  });

  describe('#buildEffect', function() {
    it('requests the character detail using the edit route params', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash']);
      const characterClient = jasmine.createSpyObj('characterClient', ['fetchPc', 'fetchPcFull', 'fetchPcAccess', 'updatePc']);

      client.currentHash.and.returnValue('#/games/demo/pcs/2/edit');
      characterClient.fetchPc.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 2, can_edit: false }),
      }));
      characterClient.fetchPcAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: true }),
      }));
      characterClient.fetchPcFull.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 2, can_edit: true, private_description: 'Secret.' }),
      }));

      const controller = new PcCharacterEditController(
        setCharacter,
        setLoading,
        setError,
        Noop.noop,
        client,
        characterClient,
      );
      const cleanup = controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(characterClient.fetchPc).toHaveBeenCalledWith('demo', '2', null);
      expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: true, private_description: 'Secret.' });

      cleanup();
    });
  });

});
