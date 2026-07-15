import OpenPollsWidgetController
  from '../../../../../../../../../assets/js/components/resources/game/pages/elements/controllers/OpenPollsWidgetController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';

describe('OpenPollsWidgetController', function() {
  let setCount;
  let setLoading;
  let pollClient;

  beforeEach(function() {
    setCount = jasmine.createSpy('setCount');
    setLoading = jasmine.createSpy('setLoading');
    pollClient = jasmine.createSpyObj('pollClient', ['fetchPolls']);
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    it('fetches the open polls count from the total response header', async function() {
      const headers = new Map([['total', '3']]);
      pollClient.fetchPolls.and.returnValue(Promise.resolve({ ok: true, headers: { get: (key) => headers.get(key) } }));

      const cleanup = new OpenPollsWidgetController(setCount, setLoading, pollClient).buildEffect('demo')();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(pollClient.fetchPolls).toHaveBeenCalledWith('demo', null, jasmine.any(URLSearchParams));
      const [, , params] = pollClient.fetchPolls.calls.mostRecent().args;
      expect(params.toString()).toBe('per_page=1&status=open');
      expect(setCount).toHaveBeenCalledWith(3);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('defaults the count to 0 when the total header is missing', async function() {
      pollClient.fetchPolls.and.returnValue(Promise.resolve({ ok: true, headers: { get: () => null } }));

      const cleanup = new OpenPollsWidgetController(setCount, setLoading, pollClient).buildEffect('demo')();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCount).toHaveBeenCalledWith(0);

      cleanup();
    });

    it('defaults the count to 0 when the response is not ok', async function() {
      pollClient.fetchPolls.and.returnValue(Promise.resolve({ ok: false, headers: { get: () => '9' } }));

      const cleanup = new OpenPollsWidgetController(setCount, setLoading, pollClient).buildEffect('demo')();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCount).toHaveBeenCalledWith(0);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('defaults the count to 0 when the fetch rejects', async function() {
      pollClient.fetchPolls.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new OpenPollsWidgetController(setCount, setLoading, pollClient).buildEffect('demo')();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCount).toHaveBeenCalledWith(0);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('does not update state after unmount', async function() {
      const headers = new Map([['total', '3']]);
      pollClient.fetchPolls.and.returnValue(Promise.resolve({ ok: true, headers: { get: (key) => headers.get(key) } }));

      const cleanup = new OpenPollsWidgetController(setCount, setLoading, pollClient).buildEffect('demo')();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCount).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
