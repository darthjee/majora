import GameSessionController, { getSessionParamsFromHash }
  from '../../../../../../assets/js/components/pages/controllers/GameSessionController.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';

describe('GameSessionController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('extracts game slug and id from a session hash', function() {
    expect(getSessionParamsFromHash('#/games/demo/sessions/7')).toEqual({
      game_slug: 'demo',
      id: '7',
    });
  });

  it('returns empty strings when the hash does not match the session route', function() {
    expect(getSessionParamsFromHash('#/games/demo')).toEqual({ game_slug: '', id: '' });
  });

  describe('#buildEffect', function() {
    it('fetches the session and calls setSession with the result', async function() {
      const setSession = jasmine.createSpy('setSession');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const sessionClient = jasmine.createSpyObj('sessionClient', ['fetchSession']);
      const fakeWindow = { location: { hash: '#/games/demo/sessions/7' } };
      globalThis.window = fakeWindow;

      sessionClient.fetchSession.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: 7, title: 'Session 1', date: '2024-01-01', game_slug: 'demo', can_edit: true,
        }),
      }));

      try {
        const controller = new GameSessionController(setSession, setLoading, setError, sessionClient);
        const cleanup = controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(sessionClient.fetchSession).toHaveBeenCalledWith('demo', '7', null);
        expect(setSession).toHaveBeenCalledWith({
          id: 7, title: 'Session 1', date: '2024-01-01', game_slug: 'demo', can_edit: true,
        });
        expect(setLoading).toHaveBeenCalledWith(false);
        expect(setError).not.toHaveBeenCalled();

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });

    it('sends the token when the user is authenticated', async function() {
      const setSession = jasmine.createSpy('setSession');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const sessionClient = jasmine.createSpyObj('sessionClient', ['fetchSession']);
      const fakeWindow = { location: { hash: '#/games/demo/sessions/7' } };
      globalThis.window = fakeWindow;

      AuthStorage.setToken('tok-abc');

      sessionClient.fetchSession.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 7, title: 'Session 1', game_slug: 'demo' }),
      }));

      try {
        const controller = new GameSessionController(setSession, setLoading, setError, sessionClient);
        const cleanup = controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(sessionClient.fetchSession).toHaveBeenCalledWith('demo', '7', 'tok-abc');

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });

    it('sets error when the session fetch fails', async function() {
      const setSession = jasmine.createSpy('setSession');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const sessionClient = jasmine.createSpyObj('sessionClient', ['fetchSession']);
      const fakeWindow = { location: { hash: '#/games/demo/sessions/7' } };
      globalThis.window = fakeWindow;

      sessionClient.fetchSession.and.returnValue(Promise.resolve({ ok: false }));

      try {
        const controller = new GameSessionController(setSession, setLoading, setError, sessionClient);
        const cleanup = controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(setSession).not.toHaveBeenCalled();
        expect(setError).toHaveBeenCalledWith('Unable to load session.');
        expect(setLoading).toHaveBeenCalledWith(false);

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });

    it('sets error without fetching when the id is missing', async function() {
      const setSession = jasmine.createSpy('setSession');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const sessionClient = jasmine.createSpyObj('sessionClient', ['fetchSession']);
      const fakeWindow = { location: { hash: '#/games/demo/sessions' } };
      globalThis.window = fakeWindow;

      try {
        const controller = new GameSessionController(setSession, setLoading, setError, sessionClient);
        const cleanup = controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(sessionClient.fetchSession).not.toHaveBeenCalled();
        expect(setError).toHaveBeenCalledWith('Unable to load session.');
        expect(setLoading).toHaveBeenCalledWith(false);

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });

    it('does not update state after unmount', async function() {
      const setSession = jasmine.createSpy('setSession');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const sessionClient = jasmine.createSpyObj('sessionClient', ['fetchSession']);
      const fakeWindow = { location: { hash: '#/games/demo/sessions/7' } };
      globalThis.window = fakeWindow;

      sessionClient.fetchSession.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 7, title: 'Session 1', game_slug: 'demo' }),
      }));

      try {
        const controller = new GameSessionController(setSession, setLoading, setError, sessionClient);
        const cleanup = controller.buildEffect()();

        cleanup();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(setSession).not.toHaveBeenCalled();
        expect(setLoading).not.toHaveBeenCalled();
      } finally {
        delete globalThis.window;
      }
    });
  });
});
