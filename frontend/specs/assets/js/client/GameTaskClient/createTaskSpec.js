import GameTaskClient from '../../../../../assets/js/client/GameTaskClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('GameTaskClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#createTask', function() {
    itSendsAuthHeader({
      call: (token) => new GameTaskClient().createTask(
        'demo', token, { short_description: 'Prep encounter', long_description: 'Details' },
      ),
      url: '/games/demo/tasks.json',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify({ short_description: 'Prep encounter', long_description: 'Details' }),
      token: 'tok-abc',
    });
  });
});
