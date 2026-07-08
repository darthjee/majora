import GameTaskClient from '../../../../../assets/js/client/GameTaskClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('GameTaskClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#updateTask', function() {
    itSendsAuthHeader({
      call: (token) => new GameTaskClient().updateTask('demo', 42, token, { completed: true }),
      url: '/games/demo/tasks/42.json',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify({ completed: true }),
      token: 'tok-abc',
    });
  });
});
