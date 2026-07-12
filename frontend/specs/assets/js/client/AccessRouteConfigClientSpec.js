import AccessRouteConfigClient from '../../../../assets/js/client/AccessRouteConfigClient.js';
import { stubFetchJson } from '../../../support/fetchMock.js';

describe('AccessRouteConfigClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson({ game: { kind: 'game' } });
  });

  describe('#fetchAccessRouteConfig', function() {
    it('fetches the access-route-config endpoint without a token', async function() {
      await new AccessRouteConfigClient().fetchAccessRouteConfig();

      expect(fetchSpy).toHaveBeenCalledWith('/access-route-config.json', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        body: undefined,
      });
    });

    it('passes the signal through when given', async function() {
      const controller = new AbortController();

      await new AccessRouteConfigClient().fetchAccessRouteConfig(controller.signal);

      expect(fetchSpy).toHaveBeenCalledWith('/access-route-config.json', jasmine.objectContaining({
        signal: controller.signal,
      }));
    });
  });
});
