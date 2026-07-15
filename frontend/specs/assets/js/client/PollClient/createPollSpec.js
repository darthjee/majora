import PollClient from '../../../../../assets/js/client/PollClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('PollClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#createPoll', function() {
    itSendsAuthHeader({
      call: (token) => new PollClient().createPoll('demo', token, {
        title: 'Which tavern?',
        description: 'Pick one for tonight.',
        type: 'single',
        options: [{ option: 'The Drunken Griffin' }, { option: 'The Rusty Anchor' }],
      }),
      url: '/games/demo/polls.json',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify({
        title: 'Which tavern?',
        description: 'Pick one for tonight.',
        type: 'single',
        options: [{ option: 'The Drunken Griffin' }, { option: 'The Rusty Anchor' }],
      }),
      token: 'tok-abc',
    });
  });
});
