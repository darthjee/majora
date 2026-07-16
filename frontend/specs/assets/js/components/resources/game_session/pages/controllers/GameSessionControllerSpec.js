import GameSessionController
  from '../../../../../../../../assets/js/components/resources/game_session/pages/controllers/GameSessionController.js';
import AuthStorage from '../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import { stubEnsureGamePermissions } from '../../../game/pages/controllers/GameController/support.js';

describe('GameSessionController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('extracts game slug and id from a session hash', function() {
    expect(GameSessionController.getSessionParamsFromHash('#/games/demo/sessions/7')).toEqual({
      game_slug: 'demo',
      id: '7',
    });
  });

  it('returns empty strings when the hash does not match the session route', function() {
    expect(GameSessionController.getSessionParamsFromHash('#/games/demo')).toEqual({ game_slug: '', id: '' });
  });

  describe('#buildEffect', function() {
    it('fetches the session and calls setSession with the result', async function() {
      stubEnsureGamePermissions({ can_edit: true }, { can_edit: false });
      const setSession = jasmine.createSpy('setSession');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const sessionClient = jasmine.createSpyObj('sessionClient', ['fetchSession']);
      const fakeWindow = { location: { hash: '#/games/demo/sessions/7' } };
      globalThis.window = fakeWindow;

      sessionClient.fetchSession.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: 7, title: 'Session 1', date: '2024-01-01', game_slug: 'demo',
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
      stubEnsureGamePermissions();
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
      stubEnsureGamePermissions();
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
      stubEnsureGamePermissions();
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
      stubEnsureGamePermissions();
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

    it('renders can_edit false first, then merges the real can_edit once AccessStore resolves', async function() {
      const ensureGamePermissions = stubEnsureGamePermissions({ can_edit: true }, { can_edit: false });
      const setSession = jasmine.createSpy('setSession');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const sessionClient = jasmine.createSpyObj('sessionClient', ['fetchSession']);
      const fakeWindow = { location: { hash: '#/games/demo/sessions/7' } };
      globalThis.window = fakeWindow;

      sessionClient.fetchSession.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: 7, title: 'Session 1', date: '2024-01-01', game_slug: 'demo',
        }),
      }));

      try {
        const controller = new GameSessionController(setSession, setLoading, setError, sessionClient);
        const cleanup = controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(ensureGamePermissions).toHaveBeenCalledWith('demo');
        expect(setSession.calls.count()).toBe(2);
        expect(setSession.calls.argsFor(0)[0]).toEqual(
          jasmine.objectContaining({ game_slug: 'demo', can_edit: false }),
        );
        expect(setSession.calls.argsFor(1)[0]).toEqual(
          jasmine.objectContaining({ game_slug: 'demo', can_edit: true }),
        );

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });
  });

  describe('#submitPoll', function() {
    let setPollStatus;
    let sessionClient;

    beforeEach(function() {
      setPollStatus = jasmine.createSpy('setPollStatus');
      sessionClient = jasmine.createSpyObj('sessionClient', ['createSessionPoll']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
    });

    it('marks the poll submission as submitting and sends the dates payload', async function() {
      sessionClient.createSessionPoll.and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ id: 9 }),
      }));

      const controller = new GameSessionController(
        jasmine.createSpy('setSession'), jasmine.createSpy('setLoading'), jasmine.createSpy('setError'), sessionClient,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitPoll('demo', 7, ['2024-01-01', '2024-01-02'], 'single', { setPollStatus });

        expect(setPollStatus).toHaveBeenCalledWith('submitting');
        expect(sessionClient.createSessionPoll).toHaveBeenCalledWith(
          'demo', 7, 'tok-abc', ['2024-01-01', '2024-01-02'], 'single',
        );
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the new poll detail page on a 201 response', async function() {
      sessionClient.createSessionPoll.and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ id: 9 }),
      }));

      const controller = new GameSessionController(
        jasmine.createSpy('setSession'), jasmine.createSpy('setLoading'), jasmine.createSpy('setError'), sessionClient,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitPoll('demo', 7, ['2024-01-01'], 'multiple', { setPollStatus });

        expect(fakeWindow.location.hash).toBe('/games/demo/polls/9');
      } finally {
        delete globalThis.window;
      }
    });

    it('marks the poll submission as failed on a non-201 response', async function() {
      sessionClient.createSessionPoll.and.returnValue(Promise.resolve({
        status: 403,
        json: () => Promise.resolve({}),
      }));

      const controller = new GameSessionController(
        jasmine.createSpy('setSession'), jasmine.createSpy('setLoading'), jasmine.createSpy('setError'), sessionClient,
      );

      await controller.submitPoll('demo', 7, ['2024-01-01'], 'multiple', { setPollStatus });

      expect(setPollStatus).toHaveBeenCalledWith('error');
    });

    it('marks the poll submission as failed when the request throws', async function() {
      sessionClient.createSessionPoll.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameSessionController(
        jasmine.createSpy('setSession'), jasmine.createSpy('setLoading'), jasmine.createSpy('setError'), sessionClient,
      );

      await controller.submitPoll('demo', 7, ['2024-01-01'], 'multiple', { setPollStatus });

      expect(setPollStatus).toHaveBeenCalledWith('error');
    });
  });
});
