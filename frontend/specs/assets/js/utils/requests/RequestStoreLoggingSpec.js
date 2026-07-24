import RequestStoreLogging from '../../../../../assets/js/utils/requests/RequestStoreLogging.js';
import MajoraLogger from '../../../../../assets/js/utils/logging/MajoraLogger.js';

describe('RequestStoreLogging', function() {
  let debugSpy;

  beforeEach(function() {
    debugSpy = spyOn(MajoraLogger, 'debug');
  });

  describe('#wrap', function() {
    it('returns the original promise unchanged on success', async function() {
      const requestPromise = Promise.resolve({ data: { id: 1 } });

      const result = await RequestStoreLogging.wrap(
        'CharacterController', 'GET', 'npc', 'single', { gameSlug: 'demo' }, {}, requestPromise,
      );

      expect(result).toEqual({ data: { id: 1 } });
    });

    it('logs the componentName, method, resource, quantityType, params, and query at debug level ' +
      'when the call starts',
    function() {
      // eslint-disable-next-line no-empty-function
      const requestPromise = new Promise(() => {});

      RequestStoreLogging.wrap(
        'CharacterController', 'GET', 'npc', 'single', { gameSlug: 'demo' }, { search: 'x' }, requestPromise,
      );

      expect(debugSpy).toHaveBeenCalledWith({
        componentName: 'CharacterController',
        method: 'GET',
        resource: 'npc',
        quantityType: 'single',
        params: { gameSlug: 'demo' },
        query: { search: 'x' },
        event: 'start',
      });
    });

    it('logs the settled result at debug level on success', async function() {
      const requestPromise = Promise.resolve({ data: { id: 1 } });

      await RequestStoreLogging.wrap(
        'CharacterController', 'GET', 'npc', 'single', { gameSlug: 'demo' }, {}, requestPromise,
      );

      expect(debugSpy).toHaveBeenCalledWith({
        componentName: 'CharacterController',
        method: 'GET',
        resource: 'npc',
        quantityType: 'single',
        params: { gameSlug: 'demo' },
        query: {},
        event: 'settled',
        result: { data: { id: 1 } },
      });
    });

    it('rejects with the original error without swallowing it', async function() {
      const error = new Error('boom');
      const requestPromise = Promise.reject(error);

      await expectAsync(
        RequestStoreLogging.wrap(
          'CharacterController', 'GET', 'npc', 'single', { gameSlug: 'demo' }, {}, requestPromise,
        ),
      ).toBeRejectedWith(error);
    });

    it('logs the settled error at debug level on failure', async function() {
      const error = new Error('boom');
      const requestPromise = Promise.reject(error);

      await expectAsync(
        RequestStoreLogging.wrap(
          'CharacterController', 'GET', 'npc', 'single', { gameSlug: 'demo' }, {}, requestPromise,
        ),
      ).toBeRejectedWith(error);

      expect(debugSpy).toHaveBeenCalledWith({
        componentName: 'CharacterController',
        method: 'GET',
        resource: 'npc',
        quantityType: 'single',
        params: { gameSlug: 'demo' },
        query: {},
        event: 'settled',
        error,
      });
    });
  });
});
