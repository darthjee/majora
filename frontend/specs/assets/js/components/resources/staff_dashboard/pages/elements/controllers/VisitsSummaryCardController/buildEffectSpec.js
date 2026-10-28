import VisitsSummaryCardController from '../../../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/controllers/VisitsSummaryCardController.js';
import RequestStore from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import flushMicrotasks from '../../../../../../../../../../specs/support/flushMicrotasks.js';
import { buildContext, lastQuery, stubEnsure } from './support.js';

describe('VisitsSummaryCardController', function() {
  let context;

  const build = () => new VisitsSummaryCardController(
    context.setSummary, context.setStatus, context.setLoading, context.setError, context.timezone,
  );

  beforeEach(function() {
    context = buildContext();
  });

  describe('#buildEffect', function() {
    it('fetches the day summary with the browser timezone', async function() {
      stubEnsure();

      const cleanup = build().buildEffect()();
      await flushMicrotasks();

      expect(RequestStore.ensure).toHaveBeenCalledWith(jasmine.objectContaining({
        componentName: 'VisitsSummaryCardController',
        resource: 'staffStatistics',
        quantityType: 'summary',
      }));
      expect(lastQuery()).toEqual({ period: 'day', tz: 'America/Sao_Paulo' });

      cleanup();
    });

    it('leaves tz out when the resolver returns nothing', async function() {
      stubEnsure();
      context.timezone.and.returnValue('');

      const cleanup = build().buildEffect()();
      await flushMicrotasks();

      expect(lastQuery()).toEqual({ period: 'day' });

      cleanup();
    });

    it('leaves tz out when the resolver throws', async function() {
      stubEnsure();
      context.timezone.and.throwError('no Intl');

      const cleanup = build().buildEffect()();
      await flushMicrotasks();

      expect(lastQuery()).toEqual({ period: 'day' });

      cleanup();
    });

    it('uses the Intl timezone by default', async function() {
      stubEnsure();

      const cleanup = new VisitsSummaryCardController(
        context.setSummary, context.setStatus, context.setLoading, context.setError,
      ).buildEffect()();
      await flushMicrotasks();

      expect(lastQuery().period).toBe('day');
      expect(lastQuery().tz).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone || undefined);

      cleanup();
    });

    it('sets the unique-visitors count and ends loading', async function() {
      stubEnsure(12);

      const cleanup = build().buildEffect()();
      await flushMicrotasks();

      expect(context.setLoading).toHaveBeenCalledWith(true);
      expect(context.setError).toHaveBeenCalledWith(false);
      expect(context.setSummary).toHaveBeenCalledWith(12);
      expect(context.setLoading.calls.mostRecent().args).toEqual([false]);

      cleanup();
    });

    it('sets a zero count as 0', async function() {
      stubEnsure(0);

      const cleanup = build().buildEffect()();
      await flushMicrotasks();

      expect(context.setSummary).toHaveBeenCalledWith(0);
      expect(context.setError).not.toHaveBeenCalledWith(true);

      cleanup();
    });

    it('sets an error and ends loading when the request rejects', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('403')));

      const cleanup = build().buildEffect()();
      await flushMicrotasks();

      expect(context.setError).toHaveBeenCalledWith(true);
      expect(context.setSummary).not.toHaveBeenCalled();
      expect(context.setLoading.calls.mostRecent().args).toEqual([false]);

      cleanup();
    });

    it('does not update state after unmount', async function() {
      stubEnsure();

      const cleanup = build().buildEffect()();
      cleanup();
      await flushMicrotasks();

      expect(context.setSummary).not.toHaveBeenCalled();
      expect(context.setLoading).not.toHaveBeenCalledWith(false);
    });
  });
});
