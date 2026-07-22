import RequestStore from '../../../../../assets/js/utils/requests/RequestStore.js';
import RequestPermissionResolvers from '../../../../../assets/js/utils/requests/RequestPermissionResolvers.js';
import Request from '../../../../../assets/js/utils/requests/Request.js';
import AuthEvents from '../../../../../assets/js/utils/auth/AuthEvents.js';
import AccessEvents from '../../../../../assets/js/utils/access/AccessEvents.js';

describe('RequestStore', function() {
  afterEach(function() {
    RequestStore.reset();
  });

  describe('#ensure', function() {
    it('resolves permissions for the resource/quantity-type/params and delegates to a Request', async function() {
      spyOn(RequestPermissionResolvers, 'resolve').and.returnValue(Promise.resolve({ can_edit: true }));
      const ensureSpy = spyOn(Request.prototype, 'ensure').and.returnValue(Promise.resolve({ data: { id: 1 } }));

      const result = await RequestStore.ensure({
        resource: 'npc', quantityType: 'collection', params: { gameSlug: 'demo' }, query: { search: 'x' },
      });

      expect(RequestPermissionResolvers.resolve).toHaveBeenCalledWith('npc', 'collection', { gameSlug: 'demo' });
      expect(ensureSpy).toHaveBeenCalledWith({
        permissions: { can_edit: true }, params: { gameSlug: 'demo' }, query: { search: 'x' },
      });
      expect(result).toEqual({ data: { id: 1 } });
    });

    it('reuses the same Request instance for the same resource/quantity-type/params', async function() {
      spyOn(RequestPermissionResolvers, 'resolve').and.returnValue(Promise.resolve({}));
      const ensureSpy = spyOn(Request.prototype, 'ensure').and.returnValue(Promise.resolve({ data: {} }));

      await RequestStore.ensure({ resource: 'npc', quantityType: 'collection', params: { gameSlug: 'demo' } });
      await RequestStore.ensure({ resource: 'npc', quantityType: 'collection', params: { gameSlug: 'demo' } });

      expect(ensureSpy.calls.count()).toBe(2);
      expect(ensureSpy.calls.all().every((call) => call.object === ensureSpy.calls.first().object)).toBe(true);
    });

    it('uses a different Request instance for different params', async function() {
      spyOn(RequestPermissionResolvers, 'resolve').and.returnValue(Promise.resolve({}));
      const ensureSpy = spyOn(Request.prototype, 'ensure').and.returnValue(Promise.resolve({ data: {} }));

      await RequestStore.ensure({ resource: 'npc', quantityType: 'collection', params: { gameSlug: 'demo' } });
      await RequestStore.ensure({ resource: 'npc', quantityType: 'collection', params: { gameSlug: 'other' } });

      const objects = ensureSpy.calls.all().map((call) => call.object);
      expect(objects[0]).not.toBe(objects[1]);
    });
  });

  describe('#resyncPermissions', function() {
    it('re-resolves permissions and re-invokes ensure for every held request', async function() {
      spyOn(RequestPermissionResolvers, 'resolve').and.returnValue(Promise.resolve({ can_edit: false }));
      const ensureSpy = spyOn(Request.prototype, 'ensure').and.returnValue(Promise.resolve({ data: {} }));

      await RequestStore.ensure({ resource: 'npc', quantityType: 'collection', params: { gameSlug: 'demo' } });
      ensureSpy.calls.reset();
      RequestPermissionResolvers.resolve.and.returnValue(Promise.resolve({ can_edit: true }));

      RequestStore.resyncPermissions();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        permissions: { can_edit: true }, params: { gameSlug: 'demo' }, query: {},
      });
    });

    it('does nothing when no request has ever been made', function() {
      expect(() => RequestStore.resyncPermissions()).not.toThrow();
    });
  });

  describe('#reset', function() {
    it('aborts every held request and clears the map so a later ensure() starts fresh', async function() {
      spyOn(RequestPermissionResolvers, 'resolve').and.returnValue(Promise.resolve({}));
      const ensureSpy = spyOn(Request.prototype, 'ensure').and.returnValue(Promise.resolve({ data: {} }));
      const abortSpy = spyOn(Request.prototype, 'abort');

      await RequestStore.ensure({ resource: 'npc', quantityType: 'collection', params: { gameSlug: 'demo' } });

      RequestStore.reset();

      expect(abortSpy).toHaveBeenCalled();

      await RequestStore.ensure({ resource: 'npc', quantityType: 'collection', params: { gameSlug: 'demo' } });

      const objects = ensureSpy.calls.all().map((call) => call.object);
      expect(objects[0]).not.toBe(objects[1]);
    });
  });

  describe('#subscribe', function() {
    it('re-syncs permissions when auth changes', function() {
      let authHandler;
      spyOn(AuthEvents, 'subscribe').and.callFake((handler) => {
        authHandler = handler;
      });
      spyOn(AccessEvents, 'subscribeFacadeChanged');
      spyOn(RequestStore, 'resyncPermissions');

      RequestStore.subscribe();
      authHandler();

      expect(RequestStore.resyncPermissions).toHaveBeenCalled();
    });

    it('re-syncs permissions when the facade changes', function() {
      let facadeHandler;
      spyOn(AuthEvents, 'subscribe');
      spyOn(AccessEvents, 'subscribeFacadeChanged').and.callFake((handler) => {
        facadeHandler = handler;
      });
      spyOn(RequestStore, 'resyncPermissions');

      RequestStore.subscribe();
      facadeHandler();

      expect(RequestStore.resyncPermissions).toHaveBeenCalled();
    });

    it('returns an unsubscribe function undoing both subscriptions with the same handler', function() {
      spyOn(AuthEvents, 'subscribe');
      spyOn(AuthEvents, 'unsubscribe');
      spyOn(AccessEvents, 'subscribeFacadeChanged');
      spyOn(AccessEvents, 'unsubscribeFacadeChanged');

      const unsubscribe = RequestStore.subscribe();
      unsubscribe();

      expect(AuthEvents.subscribe.calls.first().args[0]).toBe(AuthEvents.unsubscribe.calls.first().args[0]);
      expect(AccessEvents.subscribeFacadeChanged.calls.first().args[0])
        .toBe(AccessEvents.unsubscribeFacadeChanged.calls.first().args[0]);
    });
  });
});
