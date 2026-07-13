import GameSessionEditController
  from '../../../../../../../../../assets/js/components/resources/game_session/pages/controllers/GameSessionEditController.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/AuthStorage.js';

describe('GameSessionEditController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    it('fetches the session and calls setSession with the result', async function() {
      const setSession = jasmine.createSpy('setSession');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const sessionClient = jasmine.createSpyObj('sessionClient', ['fetchSession']);
      const fakeWindow = { location: { hash: '#/games/demo/sessions/7/edit' } };
      globalThis.window = fakeWindow;

      sessionClient.fetchSession.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: 7, title: 'Session 1', date: '2024-01-01', game_slug: 'demo', can_edit: true,
        }),
      }));

      try {
        const controller = new GameSessionEditController(
          setSession, setLoading, setError, Noop.noop, sessionClient,
        );
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

    it('sets error when the session fetch fails', async function() {
      const setSession = jasmine.createSpy('setSession');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const sessionClient = jasmine.createSpyObj('sessionClient', ['fetchSession']);
      const fakeWindow = { location: { hash: '#/games/demo/sessions/7/edit' } };
      globalThis.window = fakeWindow;

      sessionClient.fetchSession.and.returnValue(Promise.resolve({ ok: false }));

      try {
        const controller = new GameSessionEditController(
          setSession, setLoading, setError, Noop.noop, sessionClient,
        );
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

    it('sets error without fetching when route params are missing', async function() {
      const setSession = jasmine.createSpy('setSession');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const sessionClient = jasmine.createSpyObj('sessionClient', ['fetchSession']);
      const fakeWindow = { location: { hash: '#/games/demo/sessions' } };
      globalThis.window = fakeWindow;

      try {
        const controller = new GameSessionEditController(
          setSession, setLoading, setError, Noop.noop, sessionClient,
        );
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
  });
});
