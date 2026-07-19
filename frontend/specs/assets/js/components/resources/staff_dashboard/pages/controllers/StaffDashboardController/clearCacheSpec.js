import StaffDashboardController from '../../../../../../../../../assets/js/components/resources/staff_dashboard/pages/controllers/StaffDashboardController.js';
import { buildContext } from './support.js';

describe('StaffDashboardController', function() {
  let setLoading;
  let setError;
  let setStatus;
  let client;

  beforeEach(function() {
    ({ setLoading, setError, setStatus, client } = buildContext());
  });

  describe('#clearCache', function() {
    it('sets status to loading, then success on a successful response', async function() {
      client.clearCache.and.returnValue(Promise.resolve({ ok: true }));

      await new StaffDashboardController(setLoading, setError, client).clearCache(setStatus);

      expect(setStatus).toHaveBeenCalledWith('loading');
      expect(setStatus).toHaveBeenCalledWith('success');
    });

    it('sets status to error when the response is not ok', async function() {
      client.clearCache.and.returnValue(Promise.resolve({ ok: false }));

      await new StaffDashboardController(setLoading, setError, client).clearCache(setStatus);

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the request rejects', async function() {
      client.clearCache.and.returnValue(Promise.reject(new Error('network error')));

      await new StaffDashboardController(setLoading, setError, client).clearCache(setStatus);

      expect(setStatus).toHaveBeenCalledWith('error');
    });
  });
});
