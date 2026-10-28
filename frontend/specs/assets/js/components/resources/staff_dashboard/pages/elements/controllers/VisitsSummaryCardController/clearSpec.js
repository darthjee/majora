import VisitsSummaryCardController from '../../../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/controllers/VisitsSummaryCardController.js';
import RequestStore from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { mockFetchJson } from '../../../../../../../../../../specs/support/fetchMock.js';
import { buildContext } from './support.js';

describe('VisitsSummaryCardController', function() {
  let context;
  let controller;

  beforeEach(function() {
    context = buildContext();
    controller = new VisitsSummaryCardController(
      context.setSummary, context.setStatus, context.setLoading, context.setError, context.timezone,
    );
    spyOn(controller, 'refresh').and.returnValue(Promise.resolve());
  });

  describe('#clear', function() {
    it('sends DELETE clear through the RequestStore', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(mockFetchJson({})));

      await controller.clear();

      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'VisitsSummaryCardController',
        resource: 'staffStatistics',
        method: 'DELETE',
        quantityType: 'clear',
        variantName: 'regular',
      });
      expect(context.setStatus.calls.argsFor(0)).toEqual(['loading']);
    });

    it('sets a success status with the deleted counts, then refreshes', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve(mockFetchJson({ deleted_visits: 7, deleted_sessions: 3 })),
      );

      await controller.clear();

      expect(context.setStatus).toHaveBeenCalledWith({ state: 'success', deletedVisits: 7, deletedSessions: 3 });
      expect(controller.refresh).toHaveBeenCalled();
    });

    it('sets an error status on a non-ok response, then refreshes', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(mockFetchJson({}, { ok: false })));

      await controller.clear();

      expect(context.setStatus.calls.mostRecent().args).toEqual(['error']);
      expect(controller.refresh).toHaveBeenCalled();
    });

    it('sets an error status when the request rejects, then refreshes', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.reject(new Error('network error')));

      await controller.clear();

      expect(context.setStatus.calls.mostRecent().args).toEqual(['error']);
      expect(controller.refresh).toHaveBeenCalled();
    });
  });
});
