import StaffCacheClient from '../../../../../assets/js/client/StaffCacheClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('StaffCacheClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#clearDiskCache', function() {
    itSendsAuthHeader({
      call: (token) => new StaffCacheClient().clearDiskCache(token),
      url: '/staff/cache/disk.json',
      method: 'DELETE',
      headers: { 'X-Skip-Cache': 'true' },
      token: 'tok-abc',
    });
  });
});
