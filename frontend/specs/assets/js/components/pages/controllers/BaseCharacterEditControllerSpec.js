import BaseCharacterEditController, { resolveLoadedCharacter }
  from '../../../../../../assets/js/components/pages/controllers/BaseCharacterEditController.js';
import NpcCharacterController
  from '../../../../../../assets/js/components/pages/controllers/NpcCharacterController.js';
import { getNpcCharacterEditParamsFromHash }
  from '../../../../../../assets/js/components/pages/controllers/NpcCharacterEditController.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';

class TestCharacterEditController extends BaseCharacterEditController {
  constructor(setCharacter, setLoading, setError, setFieldErrors, client, characterClient) {
    super(
      setCharacter, setLoading, setError, setFieldErrors,
      NpcCharacterController, getNpcCharacterEditParamsFromHash,
      'npcs', 'updateNpc', client, characterClient,
    );
  }
}

describe('BaseCharacterEditController', function() {
  let setCharacter;
  let setLoading;
  let setError;
  let setFieldErrors;
  let client;
  let characterClient;

  afterEach(function() {
    AuthStorage.clearToken();
  });

  beforeEach(function() {
    setCharacter = jasmine.createSpy('setCharacter');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setFieldErrors = jasmine.createSpy('setFieldErrors');
    client = jasmine.createSpyObj('client', ['currentHash']);
    characterClient = jasmine.createSpyObj('characterClient', ['fetchNpc', 'updateNpc']);
  });

  describe('resolveLoadedCharacter', function() {
    it('neither redirects nor seeds fields while the character has not loaded yet', function() {
      expect(resolveLoadedCharacter(null)).toEqual({ redirect: false, fields: null });
    });

    it('redirects when the loaded character cannot be edited', function() {
      expect(resolveLoadedCharacter({ id: 1, can_edit: false })).toEqual({
        redirect: true, fields: null,
      });
    });

    it('returns seed fields when the loaded character can be edited', function() {
      const character = {
        id: 1, name: 'Test Hero', avatar_url: 'http://example.com/a.png',
        role: 'Fighter',
        public_description: 'A brave hero', private_description: 'DM notes', can_edit: true,
      };

      expect(resolveLoadedCharacter(character)).toEqual({
        redirect: false,
        fields: {
          name: 'Test Hero', avatar_url: 'http://example.com/a.png',
          role: 'Fighter',
          public_description: 'A brave hero', private_description: 'DM notes',
        },
      });
    });

    it('defaults missing fields to empty strings', function() {
      expect(resolveLoadedCharacter({ id: 1, can_edit: true })).toEqual({
        redirect: false,
        fields: {
          name: '', avatar_url: '', role: '',
          public_description: '', private_description: '',
        },
      });
    });
  });

  describe('#applyLoadedCharacter', function() {
    let setters;

    beforeEach(function() {
      setters = {
        setName: jasmine.createSpy('setName'),
        setAvatarUrl: jasmine.createSpy('setAvatarUrl'),
        setRole: jasmine.createSpy('setRole'),
        setDescription: jasmine.createSpy('setDescription'),
        setPrivateDescription: jasmine.createSpy('setPrivateDescription'),
      };
    });

    it('does nothing while the character has not loaded yet', function() {
      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
      );

      controller.applyLoadedCharacter(null, 'demo', '1', setters);

      expect(setters.setName).not.toHaveBeenCalled();
      expect(setters.setAvatarUrl).not.toHaveBeenCalled();
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
        id: 1, name: 'Test Hero', avatar_url: 'http://example.com/a.png',
        role: 'Fighter',
        public_description: 'A brave hero', private_description: 'DM notes', can_edit: true,
      };

      controller.applyLoadedCharacter(character, 'demo', '1', setters);

      expect(setters.setName).toHaveBeenCalledWith('Test Hero');
      expect(setters.setAvatarUrl).toHaveBeenCalledWith('http://example.com/a.png');
      expect(setters.setRole).toHaveBeenCalledWith('Fighter');
      expect(setters.setDescription).toHaveBeenCalledWith('A brave hero');
      expect(setters.setPrivateDescription).toHaveBeenCalledWith('DM notes');
    });
  });

  describe('#submitForm', function() {
    let setStatus;

    beforeEach(function() {
      setStatus = jasmine.createSpy('setStatus');
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-test');
      characterClient.updateNpc.and.returnValue(Promise.resolve({
        ok: true, status: 200, json: () => Promise.resolve({ id: 1, can_edit: true }),
      }));
    });

    it('prevents default, resets status/errors, and submits the built fields payload', async function() {
      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
      );
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          event, 'demo', '1',
          {
            name: 'Test Hero', avatarUrl: 'http://example.com/a.png',
            role: 'Fighter',
            description: 'A brave hero', privateDescription: 'DM notes',
          },
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(characterClient.updateNpc).toHaveBeenCalledWith(
          'demo', '1', 'tok-test',
          {
            name: 'Test Hero', avatar_url: 'http://example.com/a.png',
            role: 'Fighter',
            public_description: 'A brave hero', private_description: 'DM notes',
          },
        );
      } finally {
        delete globalThis.window;
      }
    });

    it('sets per-field errors on a 400 response without redirecting', async function() {
      characterClient.updateNpc.and.returnValue(Promise.resolve({
        ok: false, status: 400,
        json: () => Promise.resolve({ errors: { role: ['is invalid'] } }),
      }));

      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined, 'demo', '1',
          { name: '', avatarUrl: '', role: '', description: '', privateDescription: '' },
          { setStatus, setFieldErrors },
        );

        expect(setFieldErrors).toHaveBeenCalledWith({ role: ['is invalid'] });
        expect(setError).not.toHaveBeenCalled();
        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });
  });

  describe('#buildEffect', function() {
    it('delegates to the load controller buildEffect', async function() {
      const fullCharacterClient = jasmine.createSpyObj('characterClient', [
        'fetchNpc', 'fetchNpcFull', 'fetchNpcAccess', 'updateNpc',
      ]);

      client.currentHash.and.returnValue('#/games/demo/npcs/1/edit');
      fullCharacterClient.fetchNpc.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ id: 1, can_edit: false }),
      }));
      fullCharacterClient.fetchNpcAccess.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ can_edit: true }),
      }));
      fullCharacterClient.fetchNpcFull.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ id: 1, can_edit: true, private_description: 'Notes.' }),
      }));

      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, () => {}, client, fullCharacterClient,
      );
      const cleanup = controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fullCharacterClient.fetchNpc).toHaveBeenCalledWith('demo', '1', null);
      expect(setCharacter).toHaveBeenCalledWith({ id: 1, can_edit: true, private_description: 'Notes.' });

      cleanup();
    });
  });
});
