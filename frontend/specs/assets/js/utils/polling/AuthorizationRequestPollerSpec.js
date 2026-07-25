import AuthorizationRequestPoller from '../../../../../assets/js/utils/polling/AuthorizationRequestPoller.js';

describe('AuthorizationRequestPoller', function() {
  let client;
  let onEvent;
  let request;

  beforeEach(function() {
    client = { pollAuthorizationRequest: jasmine.createSpy('pollAuthorizationRequest') };
    onEvent = jasmine.createSpy('onEvent');
    request = {
      uuid: 'some-uuid',
      token: 'authorize-tok',
      expiration: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
    jasmine.clock().install();
  });

  afterEach(function() {
    jasmine.clock().uninstall();
  });

  describe('#start', function() {
    it('polls the client at the given interval', async function() {
      client.pollAuthorizationRequest.and.returnValue(Promise.resolve({ status: 200 }));

      const poller = new AuthorizationRequestPoller(client);

      poller.start(request, onEvent, 1000);
      jasmine.clock().tick(1000);
      await Promise.resolve();
      await Promise.resolve();

      expect(client.pollAuthorizationRequest).toHaveBeenCalledWith('some-uuid', 'authorize-tok');
    });

    it('uses 5000ms as the default polling interval', function() {
      client.pollAuthorizationRequest.and.returnValue(Promise.resolve({ status: 200 }));

      const poller = new AuthorizationRequestPoller(client);

      poller.start(request, onEvent);
      jasmine.clock().tick(4999);

      expect(client.pollAuthorizationRequest).not.toHaveBeenCalled();

      jasmine.clock().tick(1);

      expect(client.pollAuthorizationRequest).toHaveBeenCalledTimes(1);
    });

    it('reports an "open" event and keeps polling on a 200 response', async function() {
      client.pollAuthorizationRequest.and.returnValue(Promise.resolve({ status: 200 }));

      const poller = new AuthorizationRequestPoller(client);

      poller.start(request, onEvent, 1000);
      jasmine.clock().tick(2000);
      await Promise.resolve();
      await Promise.resolve();

      expect(onEvent).toHaveBeenCalledWith({ status: 'open' });
      expect(client.pollAuthorizationRequest).toHaveBeenCalledTimes(2);
    });

    it('reports an "approved" event with the token and stops polling on a 202 response', async function() {
      client.pollAuthorizationRequest.and.returnValue(Promise.resolve({
        status: 202,
        json: () => Promise.resolve({ token: 'login-tok' }),
      }));

      const poller = new AuthorizationRequestPoller(client);

      poller.start(request, onEvent, 1000);
      jasmine.clock().tick(1000);
      await Promise.resolve();
      await Promise.resolve();
      jasmine.clock().tick(1000);

      expect(onEvent).toHaveBeenCalledWith({ status: 'approved', token: 'login-tok' });
      expect(client.pollAuthorizationRequest).toHaveBeenCalledTimes(1);
    });

    it('reports an "expired" event and stops polling on a 422 response', async function() {
      client.pollAuthorizationRequest.and.returnValue(Promise.resolve({ status: 422 }));

      const poller = new AuthorizationRequestPoller(client);

      poller.start(request, onEvent, 1000);
      jasmine.clock().tick(1000);
      await Promise.resolve();
      await Promise.resolve();
      jasmine.clock().tick(1000);

      expect(onEvent).toHaveBeenCalledWith({ status: 'expired' });
      expect(client.pollAuthorizationRequest).toHaveBeenCalledTimes(1);
    });

    it('reports a "denied" event and stops polling on a 403 response', async function() {
      client.pollAuthorizationRequest.and.returnValue(Promise.resolve({ status: 403 }));

      const poller = new AuthorizationRequestPoller(client);

      poller.start(request, onEvent, 1000);
      jasmine.clock().tick(1000);
      await Promise.resolve();
      await Promise.resolve();
      jasmine.clock().tick(1000);

      expect(onEvent).toHaveBeenCalledWith({ status: 'denied' });
      expect(client.pollAuthorizationRequest).toHaveBeenCalledTimes(1);
    });

    it('reports a "retrying" event and keeps polling on a transient failure', async function() {
      client.pollAuthorizationRequest.and.returnValue(Promise.reject(new Error('network error')));

      const poller = new AuthorizationRequestPoller(client);

      poller.start(request, onEvent, 1000);
      jasmine.clock().tick(2000);
      await Promise.resolve();
      await Promise.resolve();

      expect(onEvent).toHaveBeenCalledWith({ status: 'retrying' });
      expect(client.pollAuthorizationRequest).toHaveBeenCalledTimes(2);
    });

    it('reports an "expired" event without polling once the request has expired', function() {
      request.expiration = new Date(Date.now() - 1000).toISOString();

      const poller = new AuthorizationRequestPoller(client);

      poller.start(request, onEvent, 1000);
      jasmine.clock().tick(1000);

      expect(onEvent).toHaveBeenCalledWith({ status: 'expired' });
      expect(client.pollAuthorizationRequest).not.toHaveBeenCalled();
    });

    it('stops any previously running poll before starting a new one', function() {
      client.pollAuthorizationRequest.and.returnValue(Promise.resolve({ status: 200 }));

      const poller = new AuthorizationRequestPoller(client);

      poller.start(request, onEvent, 1000);
      poller.start(request, onEvent, 1000);
      jasmine.clock().tick(1000);

      expect(client.pollAuthorizationRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('#stop', function() {
    it('stops the interval so the client is no longer polled', function() {
      client.pollAuthorizationRequest.and.returnValue(Promise.resolve({ status: 200 }));

      const poller = new AuthorizationRequestPoller(client);

      poller.start(request, onEvent, 1000);
      jasmine.clock().tick(1000);
      poller.stop();
      jasmine.clock().tick(2000);

      expect(client.pollAuthorizationRequest).toHaveBeenCalledTimes(1);
    });

    it('is safe to call when no poll is running', function() {
      const poller = new AuthorizationRequestPoller(client);

      expect(() => poller.stop()).not.toThrow();
    });
  });
});
