import VisitsSummaryCardController from '../../../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/controllers/VisitsSummaryCardController.js';
import RequestStore from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildContext, lastQuery, stubEnsure } from './support.js';

describe('VisitsSummaryCardController', function() {
  let context;

  beforeEach(function() {
    context = buildContext();
  });

  describe('#changePeriod', function() {
    it('fetches the summary again for the new period', async function() {
      stubEnsure(40);
      const controller = new VisitsSummaryCardController(
        context.setSummary, context.setStatus, context.setLoading, context.setError, context.timezone,
      );

      await controller.changePeriod('week');

      expect(RequestStore.ensure).toHaveBeenCalledTimes(1);
      expect(lastQuery()).toEqual({ period: 'week', tz: 'America/Sao_Paulo' });
      expect(context.setSummary).toHaveBeenCalledWith(40);
      expect(controller.period).toBe('week');
    });
  });
});
