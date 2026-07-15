import PollClient from '../../../../../assets/js/client/PollClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('PollClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#fetchPolls', function() {
    itSendsAuthHeader({
      call: (token) => new PollClient().fetchPolls('demo', token),
      url: '/games/demo/polls.json',
      token: 'tok-abc',
      headers: { 'X-Skip-Cache': 'true' },
    });

    it('appends pagination/filter params to the query string', async function() {
      const client = new PollClient();
      const params = new URLSearchParams({ page: '2', per_page: '10', status: 'open' });

      await client.fetchPolls('demo', 'tok-abc', params);

      expect(fetchSpy).toHaveBeenCalledWith(
        '/games/demo/polls.json?page=2&per_page=10&status=open',
        jasmine.objectContaining({
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: 'Token tok-abc',
            'X-Skip-Cache': 'true',
          },
          body: undefined,
        }),
      );
    });
  });
});
