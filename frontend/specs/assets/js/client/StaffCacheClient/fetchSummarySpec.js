import StaffCacheClient from '../../../../../assets/js/client/StaffCacheClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('StaffCacheClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#fetchSummary', function() {
    itSendsAuthHeader({
      call: (token) => new StaffCacheClient().fetchSummary(token),
      url: '/staff/cache/summary.json',
      method: 'GET',
      token: 'tok-abc',
    });
  });
});
