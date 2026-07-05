import GameNpcNewController, { getGameSlugFromNpcNewHash }
  from '../../../../../../assets/js/components/pages/controllers/GameNpcNewController.js';
import Noop from '../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';

describe('GameNpcNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('extracts game slug from an NPC new hash', function() {
    expect(getGameSlugFromNpcNewHash('#/games/demo/npcs/new')).toBe('demo');
  });

  it('returns empty string when the hash does not match the new route', function() {
    expect(getGameSlugFromNpcNewHash('#/games/demo/npcs')).toBe('');
  });

  describe('#buildEffect', function() {
    it('does not redirect when the user can edit the game', async function() {
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
      const characterClient = jasmine.createSpyObj('characterClient', ['createNpc']);
      const fakeWindow = { location: { hash: '#/games/demo/npcs/new' } };
      globalThis.window = fakeWindow;

      gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: true }),
      }));

      try {
        const controller = new GameNpcNewController(setError, Noop.noop, characterClient, gameClient);
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(gameClient.fetchGameAccess).toHaveBeenCalledWith('demo', null);
        expect(fakeWindow.location.hash).toBe('#/games/demo/npcs/new');
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the NPCs index when the user cannot edit the game', async function() {
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
      const characterClient = jasmine.createSpyObj('characterClient', ['createNpc']);
      const fakeWindow = { location: { hash: '#/games/demo/npcs/new' } };
      globalThis.window = fakeWindow;

      gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: false }),
      }));

      try {
        const controller = new GameNpcNewController(setError, Noop.noop, characterClient, gameClient);
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/games/demo/npcs');
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the NPCs index when the access response is not ok', async function() {
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
      const characterClient = jasmine.createSpyObj('characterClient', ['createNpc']);
      const fakeWindow = { location: { hash: '#/games/demo/npcs/new' } };
      globalThis.window = fakeWindow;

      gameClient.fetchGameAccess.and.returnValue(Promise.resolve({ ok: false }));

      try {
        const controller = new GameNpcNewController(setError, Noop.noop, characterClient, gameClient);
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/games/demo/npcs');
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the NPCs index when the access request throws', async function() {
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
      const characterClient = jasmine.createSpyObj('characterClient', ['createNpc']);
      const fakeWindow = { location: { hash: '#/games/demo/npcs/new' } };
      globalThis.window = fakeWindow;

      gameClient.fetchGameAccess.and.returnValue(Promise.reject(new Error('network error')));

      try {
        const controller = new GameNpcNewController(setError, Noop.noop, characterClient, gameClient);
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/games/demo/npcs');
      } finally {
        delete globalThis.window;
      }
    });
  });

  describe('#submitForm', function() {
    let setError;
    let setFieldErrors;
    let setStatus;
    let characterClient;
    let gameClient;

    beforeEach(function() {
      setError = jasmine.createSpy('setError');
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      characterClient = jasmine.createSpyObj('characterClient', ['createNpc']);
      gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      characterClient.createNpc.and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ id: 7, name: 'Goblin King', game_slug: 'demo' }),
      }));
    });

    it('prevents default, resets status/errors, and submits the fields payload', async function() {
      const controller = new GameNpcNewController(setError, setFieldErrors, characterClient, gameClient);
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          event,
          'demo',
          {
            name: 'Goblin King',
            role: 'Villain',
            description: 'A menacing goblin.',
            privateDescription: 'Secretly a coward.',
            hidden: true,
            money: '42',
          },
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(characterClient.createNpc).toHaveBeenCalledWith(
          'demo',
          'tok-abc',
          {
            name: 'Goblin King',
            role: 'Villain',
            public_description: 'A menacing goblin.',
            private_description: 'Secretly a coward.',
            hidden: true,
            money: 42,
          },
        );
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the new NPC detail page on success', async function() {
      const controller = new GameNpcNewController(setError, setFieldErrors, characterClient, gameClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          {
            name: 'Goblin King', role: '', description: '', privateDescription: '', hidden: false, money: '0',
          },
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/games/demo/npcs/7');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets field errors on a 400 response', async function() {
      characterClient.createNpc.and.returnValue(Promise.resolve({
        status: 400,
        json: () => Promise.resolve({ errors: { name: ['is required'] } }),
      }));

      const controller = new GameNpcNewController(setError, setFieldErrors, characterClient, gameClient);

      await controller.submitForm(
        undefined,
        'demo',
        { name: '', role: '', description: '', privateDescription: '', hidden: false, money: '0' },
        { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ name: ['is required'] });
    });

    it('sets status to error on a non-201/400 failure', async function() {
      characterClient.createNpc.and.returnValue(Promise.resolve({
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new GameNpcNewController(setError, setFieldErrors, characterClient, gameClient);

      await controller.submitForm(
        undefined,
        'demo',
        {
          name: 'Goblin King', role: '', description: '', privateDescription: '', hidden: false, money: '0',
        },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the network request throws', async function() {
      characterClient.createNpc.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameNpcNewController(setError, setFieldErrors, characterClient, gameClient);

      await controller.submitForm(
        undefined,
        'demo',
        {
          name: 'Goblin King', role: '', description: '', privateDescription: '', hidden: false, money: '0',
        },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('does not throw when called without an event', async function() {
      const controller = new GameNpcNewController(setError, setFieldErrors, characterClient, gameClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          {
            name: 'Goblin King', role: '', description: '', privateDescription: '', hidden: false, money: '0',
          },
          { setStatus, setFieldErrors },
        );

        expect(setStatus).toHaveBeenCalledWith('submitting');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
