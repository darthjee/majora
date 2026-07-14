import GameTaskClient from '../../../../../assets/js/client/GameTaskClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('GameTaskClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#fetchTasks', function() {
    itSendsAuthHeader({
      call: (token) => new GameTaskClient().fetchTasks('demo', token),
      url: '/games/demo/tasks.json',
      token: 'tok-abc',
    });

    it('appends pagination params to the query string', async function() {
      const client = new GameTaskClient();
      const params = new URLSearchParams({ page: '2', per_page: '10' });

      await client.fetchTasks('demo', 'tok-abc', params);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/tasks.json?page=2&per_page=10', jasmine.objectContaining({
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token tok-abc',
        },
        body: undefined,
      }));
    });
  });
});
