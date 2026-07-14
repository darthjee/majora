import BaseClient from '../../../../../assets/js/client/BaseClient.js';
import ActivityTracker from '../../../../../assets/js/utils/logging/ActivityTracker.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('BaseClient', function() {
  let client;
  let registerSpy;

  beforeEach(function() {
    stubFetchJson();
    registerSpy = spyOn(ActivityTracker, 'register');
    client = new BaseClient();
  });

  describe('activity tracking', function() {
    it('registers activity for POST requests', async function() {
      await client.request('/games/foo.json', { method: 'POST' });

      expect(registerSpy).toHaveBeenCalled();
    });

    it('registers activity for PATCH requests', async function() {
      await client.request('/games/foo.json', { method: 'PATCH' });

      expect(registerSpy).toHaveBeenCalled();
    });

    it('registers activity for DELETE requests', async function() {
      await client.request('/games/foo.json', { method: 'DELETE' });

      expect(registerSpy).toHaveBeenCalled();
    });

    it('registers activity for GET requests to allowlisted game endpoints', async function() {
      await client.request('/games.json', { method: 'GET' });

      expect(registerSpy).toHaveBeenCalled();
    });

    it('registers activity for GET requests to game sub-paths', async function() {
      await client.request('/games/my-campaign/pcs.json', { method: 'GET' });

      expect(registerSpy).toHaveBeenCalled();
    });

    it('does not register activity for GET /health.json', async function() {
      await client.request('/health.json', { method: 'GET' });

      expect(registerSpy).not.toHaveBeenCalled();
    });

    it('does not register activity for GET /users/status.json', async function() {
      await client.request('/users/status.json', { method: 'GET' });

      expect(registerSpy).not.toHaveBeenCalled();
    });
  });
});
