import StaffCacheClient from '../../../../../assets/js/client/StaffCacheClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('StaffCacheClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#fetchDiskCacheSize', function() {
    itSendsAuthHeader({
      call: (token) => new StaffCacheClient().fetchDiskCacheSize(token),
      url: '/staff/cache/size.json',
      method: 'GET',
      token: 'tok-abc',
    });
  });
});
