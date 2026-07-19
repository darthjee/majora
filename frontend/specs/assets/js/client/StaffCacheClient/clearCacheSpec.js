import StaffCacheClient from '../../../../../assets/js/client/StaffCacheClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('StaffCacheClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#clearCache', function() {
    itSendsAuthHeader({
      call: (token) => new StaffCacheClient().clearCache(token),
      url: '/staff/cache.json',
      method: 'DELETE',
      headers: { 'X-Skip-Cache': 'true' },
      token: 'tok-abc',
    });
  });
});
