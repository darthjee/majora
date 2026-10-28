import VisitsSummaryCardController from '../../../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/controllers/VisitsSummaryCardController.js';
import RequestStore from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildContext, lastQuery, stubEnsure } from './support.js';

describe('VisitsSummaryCardController', function() {
  let context;
  let controller;

  beforeEach(function() {
    context = buildContext();
    controller = new VisitsSummaryCardController(
      context.setSummary, context.setStatus, context.setLoading, context.setError, context.timezone,
    );
    spyOn(RequestStore, 'purge');
  });

  describe('#refresh', function() {
    it('purges the cached statistics before fetching again', async function() {
      stubEnsure();

      await controller.refresh();

      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'staffStatistics' });
      expect(RequestStore.purge).toHaveBeenCalledBefore(RequestStore.ensure);
    });

    it('fetches again with the current period', async function() {
      stubEnsure();
      controller.period = 'month';

      await controller.refresh();

      expect(lastQuery()).toEqual({ period: 'month', tz: 'America/Sao_Paulo' });
    });

    it('resets loading and error at the start of the fetch', async function() {
      stubEnsure();

      await controller.refresh();

      expect(context.setLoading.calls.argsFor(0)).toEqual([true]);
      expect(context.setError).toHaveBeenCalledWith(false);
      expect(context.setLoading.calls.mostRecent().args).toEqual([false]);
    });
  });
});
