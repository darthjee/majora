import PollClient from '../../../../../assets/js/client/PollClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('PollClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#castPollVotes', function() {
    itSendsAuthHeader({
      call: (token) => new PollClient().castPollVotes('demo', 42, token, [10, 11]),
      url: '/games/demo/polls/42/votes.json',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify({ option_ids: [10, 11] }),
      token: 'tok-abc',
    });
  });
});
