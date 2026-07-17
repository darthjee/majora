import AuthClient from '../../../../../assets/js/client/AuthClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('AuthClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#updateAccount', function() {
    itSendsAuthHeader({
      call: (token) => new AuthClient().updateAccount(token, {
        name: 'Jane Doe',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: token ? 'secret' : '',
        passwordConfirmation: token ? 'secret' : '',
      }),
      url: '/users/account.json',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: (token) => JSON.stringify({
        name: 'Jane Doe',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        password: token ? 'secret' : '',
        password_confirmation: token ? 'secret' : '',
      }),
    });
  });
});
