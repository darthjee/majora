import PollClient from '../../../../../assets/js/client/PollClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('PollClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#fetchPollVotes', function() {
    itSendsAuthHeader({
      call: (token) => new PollClient().fetchPollVotes('demo', 42, token),
      url: '/games/demo/polls/42/votes.json',
      token: 'tok-abc',
      headers: { 'X-Skip-Cache': 'true' },
    });

    it('appends the query params when given', async function() {
      await new PollClient().fetchPollVotes('demo', 42, 'tok-abc', new URLSearchParams({ user_id: '7' }));

      expect(fetchSpy).toHaveBeenCalledWith(
        '/games/demo/polls/42/votes.json?user_id=7',
        jasmine.objectContaining({ method: 'GET' }),
      );
    });
  });
});
