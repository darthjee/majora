import GameSessionNewController, { getGameSlugFromSessionNewHash }
  from '../../../../../../assets/js/components/pages/controllers/GameSessionNewController.js';
import Noop from '../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';

describe('GameSessionNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('extracts game slug from a session new hash', function() {
    expect(getGameSlugFromSessionNewHash('#/games/demo/sessions/new')).toBe('demo');
  });

  it('returns empty string when the hash does not match the new route', function() {
    expect(getGameSlugFromSessionNewHash('#/games/demo/sessions')).toBe('');
  });

  describe('#buildEffect', function() {
    it('does not redirect when the user can edit the game', async function() {
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
      const sessionClient = jasmine.createSpyObj('sessionClient', ['createSession']);
      const fakeWindow = { location: { hash: '#/games/demo/sessions/new' } };
      globalThis.window = fakeWindow;

      gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: true }),
      }));

      try {
        const controller = new GameSessionNewController(setError, Noop.noop, sessionClient, gameClient);
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(gameClient.fetchGameAccess).toHaveBeenCalledWith('demo', null);
        expect(fakeWindow.location.hash).toBe('#/games/demo/sessions/new');
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the sessions index when the user cannot edit the game', async function() {
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
      const sessionClient = jasmine.createSpyObj('sessionClient', ['createSession']);
      const fakeWindow = { location: { hash: '#/games/demo/sessions/new' } };
      globalThis.window = fakeWindow;

      gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: false }),
      }));

      try {
        const controller = new GameSessionNewController(setError, Noop.noop, sessionClient, gameClient);
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/games/demo/sessions');
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the sessions index when the access response is not ok', async function() {
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
      const sessionClient = jasmine.createSpyObj('sessionClient', ['createSession']);
      const fakeWindow = { location: { hash: '#/games/demo/sessions/new' } };
      globalThis.window = fakeWindow;

      gameClient.fetchGameAccess.and.returnValue(Promise.resolve({ ok: false }));

      try {
        const controller = new GameSessionNewController(setError, Noop.noop, sessionClient, gameClient);
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/games/demo/sessions');
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the sessions index when the access request throws', async function() {
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
      const sessionClient = jasmine.createSpyObj('sessionClient', ['createSession']);
      const fakeWindow = { location: { hash: '#/games/demo/sessions/new' } };
      globalThis.window = fakeWindow;

      gameClient.fetchGameAccess.and.returnValue(Promise.reject(new Error('network error')));

      try {
        const controller = new GameSessionNewController(setError, Noop.noop, sessionClient, gameClient);
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/games/demo/sessions');
      } finally {
        delete globalThis.window;
      }
    });
  });

  describe('#submitForm', function() {
    let setError;
    let setFieldErrors;
    let setStatus;
    let sessionClient;
    let gameClient;

    beforeEach(function() {
      setError = jasmine.createSpy('setError');
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      sessionClient = jasmine.createSpyObj('sessionClient', ['createSession']);
      gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      sessionClient.createSession.and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ id: 7, title: 'Session 1', game_slug: 'demo' }),
      }));
    });

    it('prevents default, resets status/errors, and submits the fields payload', async function() {
      const controller = new GameSessionNewController(setError, setFieldErrors, sessionClient, gameClient);
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          event,
          'demo',
          { title: 'Session 1', date: '2024-01-01' },
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(sessionClient.createSession).toHaveBeenCalledWith(
          'demo',
          'tok-abc',
          { title: 'Session 1', date: '2024-01-01' },
        );
      } finally {
        delete globalThis.window;
      }
    });

    it('sends null when the date field is empty', async function() {
      const controller = new GameSessionNewController(setError, setFieldErrors, sessionClient, gameClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          { title: 'Session 1', date: '' },
          { setStatus, setFieldErrors },
        );

        expect(sessionClient.createSession).toHaveBeenCalledWith(
          'demo',
          'tok-abc',
          { title: 'Session 1', date: null },
        );
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the new session detail page on success', async function() {
      const controller = new GameSessionNewController(setError, setFieldErrors, sessionClient, gameClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          { title: 'Session 1', date: '' },
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/games/demo/sessions/7');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets field errors on a 400 response', async function() {
      sessionClient.createSession.and.returnValue(Promise.resolve({
        status: 400,
        json: () => Promise.resolve({ errors: { title: ['is required'] } }),
      }));

      const controller = new GameSessionNewController(setError, setFieldErrors, sessionClient, gameClient);

      await controller.submitForm(
        undefined,
        'demo',
        { title: '', date: '' },
        { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ title: ['is required'] });
    });

    it('sets status to error on a non-201/400 failure', async function() {
      sessionClient.createSession.and.returnValue(Promise.resolve({
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new GameSessionNewController(setError, setFieldErrors, sessionClient, gameClient);

      await controller.submitForm(
        undefined,
        'demo',
        { title: 'Session 1', date: '' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the network request throws', async function() {
      sessionClient.createSession.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameSessionNewController(setError, setFieldErrors, sessionClient, gameClient);

      await controller.submitForm(
        undefined,
        'demo',
        { title: 'Session 1', date: '' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('does not throw when called without an event', async function() {
      const controller = new GameSessionNewController(setError, setFieldErrors, sessionClient, gameClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          { title: 'Session 1', date: '' },
          { setStatus, setFieldErrors },
        );

        expect(setStatus).toHaveBeenCalledWith('submitting');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
