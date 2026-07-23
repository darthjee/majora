import MemoryCacheCardController from '../../../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/controllers/MemoryCacheCardController.js';
import { buildContext } from './support.js';

describe('MemoryCacheCardController', function() {
  let setSummary;
  let setStatus;
  let setLoading;
  let setError;
  let client;

  beforeEach(function() {
    ({ setSummary, setStatus, setLoading, setError, client } = buildContext());
  });

  describe('#logData', function() {
    it('logs the raw summary via console.debug directly, bypassing MajoraLogger', function() {
      spyOn(console, 'debug');
      const summary = { size: 10, limit: 100 };

      new MemoryCacheCardController(setSummary, setStatus, setLoading, setError, client).logData(summary);

      expect(console.debug).toHaveBeenCalledWith(summary);
    });
  });
});
