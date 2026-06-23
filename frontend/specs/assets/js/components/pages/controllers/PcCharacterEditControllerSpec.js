import PcCharacterEditController, { getPcCharacterEditParamsFromHash, resolveLoadedCharacter }
  from '../../../../../../assets/js/components/pages/controllers/PcCharacterEditController.js';
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
        avatar_url: 'http://example.com/a.png',
        character_class: 'Ranger',
        level: 10,
        description: 'King',
        can_edit: true,
      };

      expect(resolveLoadedCharacter(character)).toEqual({
        redirect: false,
        fields: {
          name: 'Aragorn',
          avatar_url: 'http://example.com/a.png',
          character_class: 'Ranger',
          level: 10,
          description: 'King',
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
      const controller = new PcCharacterEditController(
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
        avatar_url: 'http://example.com/a.png',
        character_class: 'Ranger',
        level: 10,
        description: 'King',
        can_edit: true,
      };

      controller.applyLoadedCharacter(character, 'demo', '2', setters);

      expect(setters.setName).toHaveBeenCalledWith('Aragorn');
      expect(setters.setAvatarUrl).toHaveBeenCalledWith('http://example.com/a.png');
      expect(setters.setCharacterClass).toHaveBeenCalledWith('Ranger');
      expect(setters.setLevel).toHaveBeenCalledWith(10);
      expect(setters.setDescription).toHaveBeenCalledWith('King');
    });
  });

  describe('#buildEffect', function() {
    it('requests the character detail using the edit route params', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash', 'request']);

      client.currentHash.and.returnValue('#/games/demo/pcs/2/edit');
      client.request.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 2, can_edit: true }),
      }));

      const controller = new PcCharacterEditController(
        setCharacter,
        setLoading,
        setError,
        () => {},
        client,
      );
      const cleanup = controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.request).toHaveBeenCalledWith('/games/demo/pcs/2.json', jasmine.any(Object));
      expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: true });

      cleanup();
    });
  });

  describe('#handleSubmit', function() {
    let setCharacter;
    let setLoading;
    let setError;
    let setFieldErrors;
    let client;

    beforeEach(function() {
      setCharacter = jasmine.createSpy('setCharacter');
      setLoading = jasmine.createSpy('setLoading');
      setError = jasmine.createSpy('setError');
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      client = jasmine.createSpyObj('client', ['currentHash', 'request']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
    });

    it('navigates to the show page on success', async function() {
      client.request.and.returnValue(Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 2, name: 'Aragorn', can_edit: true }),
      }));

      const controller = new PcCharacterEditController(
        setCharacter,
        setLoading,
        setError,
        setFieldErrors,
        client,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.handleSubmit('demo', '2', { name: 'Aragorn' });

        expect(client.request).toHaveBeenCalledWith('/games/demo/pcs/2.json', {
          method: 'PATCH',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: 'Token tok-abc',
          },
          body: JSON.stringify({ name: 'Aragorn' }),
        });
        expect(fakeWindow.location.hash).toBe('/games/demo/pcs/2');
        expect(setFieldErrors).not.toHaveBeenCalled();
        expect(setError).not.toHaveBeenCalled();
      } finally {
        delete globalThis.window;
      }
    });

    it('sets per-field errors on a 400 response without navigating', async function() {
      client.request.and.returnValue(Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ errors: { level: ['must be a positive integer'] } }),
      }));

      const controller = new PcCharacterEditController(
        setCharacter,
        setLoading,
        setError,
        setFieldErrors,
        client,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.handleSubmit('demo', '2', { level: -1 });

        expect(setFieldErrors).toHaveBeenCalledWith({ level: ['must be a positive integer'] });
        expect(setError).not.toHaveBeenCalled();
        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets a general error on a 401 response', async function() {
      client.request.and.returnValue(Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ errors: { detail: ['authentication required'] } }),
      }));

      const controller = new PcCharacterEditController(
        setCharacter,
        setLoading,
        setError,
        setFieldErrors,
        client,
      );

      await controller.handleSubmit('demo', '2', { name: 'Aragorn' });

      expect(setError).toHaveBeenCalledWith('Unable to save character.');
      expect(setFieldErrors).not.toHaveBeenCalled();
    });

    it('sets a general error on a 403 response', async function() {
      client.request.and.returnValue(Promise.resolve({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ errors: { detail: ['not allowed to edit this character'] } }),
      }));

      const controller = new PcCharacterEditController(
        setCharacter,
        setLoading,
        setError,
        setFieldErrors,
        client,
      );

      await controller.handleSubmit('demo', '2', { name: 'Aragorn' });

      expect(setError).toHaveBeenCalledWith('Unable to save character.');
      expect(setFieldErrors).not.toHaveBeenCalled();
    });

    it('sets a general error when the request rejects', async function() {
      client.request.and.returnValue(Promise.reject(new Error('network')));

      const controller = new PcCharacterEditController(
        setCharacter,
        setLoading,
        setError,
        setFieldErrors,
        client,
      );

      await controller.handleSubmit('demo', '2', { name: 'Aragorn' });

      expect(setError).toHaveBeenCalledWith('Unable to save character.');
    });
  });
});
