import PollClient from '../../../../../assets/js/client/PollClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('PollClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#closePoll', function() {
    itSendsAuthHeader({
      call: (token) => new PollClient().closePoll('demo', 42, token),
      url: '/games/demo/polls/42/close.json',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify({}),
      token: 'tok-abc',
    });

    itSendsAuthHeader({
      call: (token) => new PollClient().closePoll('demo', 42, token, 11),
      url: '/games/demo/polls/42/close.json',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify({ option_id: 11 }),
      token: 'tok-abc',
    });
  });
});
