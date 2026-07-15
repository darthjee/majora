import PollClient from '../../../../../assets/js/client/PollClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('PollClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#fetchPoll', function() {
    itSendsAuthHeader({
      call: (token) => new PollClient().fetchPoll('demo', 42, token),
      url: '/games/demo/polls/42.json',
      token: 'tok-abc',
    });
  });
});
