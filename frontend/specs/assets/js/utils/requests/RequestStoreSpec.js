import RequestStore from '../../../../../assets/js/utils/requests/RequestStore.js';
import RequestPermissionResolvers from '../../../../../assets/js/utils/requests/RequestPermissionResolvers.js';
import Request from '../../../../../assets/js/utils/requests/Request.js';
import RequestMutationClient from '../../../../../assets/js/utils/requests/RequestMutationClient.js';
import resourceConfig from '../../../../../assets/js/utils/requests/resourceConfig.js';
import AuthEvents from '../../../../../assets/js/utils/auth/AuthEvents.js';
import AccessEvents from '../../../../../assets/js/utils/access/AccessEvents.js';
import AuthStorage from '../../../../../assets/js/utils/auth/AuthStorage.js';

describe('RequestStore', function() {
  afterEach(function() {
    RequestStore.reset();
  });

  describe('#ensure', function() {
    it('resolves permissions for the resource/quantity-type/params and delegates to a Request', async function() {
      spyOn(RequestPermissionResolvers, 'resolve').and.returnValue(Promise.resolve({ can_edit: true }));
      const ensureSpy = spyOn(Request.prototype, 'ensure').and.returnValue(Promise.resolve({ data: { id: 1 } }));

      const result = await RequestStore.ensure({
        componentName: 'NpcListPageController',
        resource: 'npc',
        quantityType: 'collection',
        params: { gameSlug: 'demo' },
        query: { search: 'x' },
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

      await RequestStore.ensure({
        componentName: 'NpcListPageController', resource: 'npc', quantityType: 'collection', params: { gameSlug: 'demo' },
      });
      await RequestStore.ensure({
        componentName: 'NpcListPageController', resource: 'npc', quantityType: 'collection', params: { gameSlug: 'demo' },
      });

      expect(ensureSpy.calls.count()).toBe(2);
      expect(ensureSpy.calls.all().every((call) => call.object === ensureSpy.calls.first().object)).toBe(true);
    });

    it('uses a different Request instance for different params', async function() {
      spyOn(RequestPermissionResolvers, 'resolve').and.returnValue(Promise.resolve({}));
      const ensureSpy = spyOn(Request.prototype, 'ensure').and.returnValue(Promise.resolve({ data: {} }));

      await RequestStore.ensure({
        componentName: 'NpcListPageController', resource: 'npc', quantityType: 'collection', params: { gameSlug: 'demo' },
      });
      await RequestStore.ensure({
        componentName: 'NpcListPageController', resource: 'npc', quantityType: 'collection', params: { gameSlug: 'other' },
      });

      const objects = ensureSpy.calls.all().map((call) => call.object);
      expect(objects[0]).not.toBe(objects[1]);
    });
  });

  describe('#mutate', function() {
    it('resolves permissions/variant, fires the mutation, and purges the resource on success', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      spyOn(RequestPermissionResolvers, 'resolve').and.returnValue(Promise.resolve({ can_edit: true }));
      const mutateSpy = spyOn(RequestMutationClient.prototype, 'mutate').and.returnValue(
        Promise.resolve({ ok: true, status: 200 }),
      );
      spyOn(RequestStore, 'purge');

      const response = await RequestStore.mutate({
        componentName: 'BaseCharacterEditController',
        resource: 'npc',
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug: 'demo', id: '2' },
        body: { name: 'New name' },
      });

      expect(RequestPermissionResolvers.resolve).toHaveBeenCalledWith('npc', 'single', { gameSlug: 'demo', id: '2' });
      expect(mutateSpy).toHaveBeenCalledWith(
        'PATCH', '/games/demo/npcs/2/full.json', { name: 'New name' }, 'tok-abc',
      );
      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'npc' });
      expect(response).toEqual({ ok: true, status: 200 });
    });

    it('does not purge when the response is not ok', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      spyOn(RequestPermissionResolvers, 'resolve').and.returnValue(Promise.resolve({}));
      spyOn(RequestMutationClient.prototype, 'mutate').and.returnValue(
        Promise.resolve({ ok: false, status: 400 }),
      );
      spyOn(RequestStore, 'purge');

      await RequestStore.mutate({
        componentName: 'BaseCharacterEditController',
        resource: 'npc',
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug: 'demo', id: '2' },
        body: {},
      });

      expect(RequestStore.purge).not.toHaveBeenCalled();
    });

    it('forces the given variant without resolving live permissions', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      spyOn(RequestPermissionResolvers, 'resolve');
      spyOn(RequestMutationClient.prototype, 'mutate').and.returnValue(
        Promise.resolve({ ok: true, status: 200 }),
      );
      spyOn(RequestStore, 'purge');

      await RequestStore.mutate({
        componentName: 'BaseCharacterEditController',
        resource: 'npc',
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug: 'demo', id: '2' },
        body: { public_description: 'hi' },
        variantName: 'regular',
      });

      expect(RequestPermissionResolvers.resolve).not.toHaveBeenCalled();
      expect(RequestMutationClient.prototype.mutate).toHaveBeenCalledWith(
        'PATCH', '/games/demo/npcs/2.json', { public_description: 'hi' }, 'tok-abc',
      );
    });

    it('also purges every resource listed in the resolved variant\'s cross-resource purge list', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      spyOn(RequestPermissionResolvers, 'resolve').and.returnValue(Promise.resolve({}));
      spyOn(RequestMutationClient.prototype, 'mutate').and.returnValue(Promise.resolve({ ok: true, status: 200 }));
      spyOn(RequestStore, 'purge');
      const fakeVariant = { path: () => '/fake/path.json', permission: null, purge: ['other'] };
      spyOn(resourceConfig, 'get').and.returnValue({ regular: fakeVariant, private: fakeVariant });

      await RequestStore.mutate({
        componentName: 'Test', resource: 'npc', method: 'PATCH', quantityType: 'single', params: {}, body: {},
      });

      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'npc' });
      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'other' });
    });

    it('rejects when no config exists for the given method/resource/quantity-type', async function() {
      await expectAsync(RequestStore.mutate({
        componentName: 'Test', resource: 'npc', method: 'DELETE', quantityType: 'single', params: {},
      })).toBeRejected();
    });
  });

  describe('#resolvePath', function() {
    it('resolves permissions/variant and returns the resolved path, without firing a request', async function() {
      spyOn(RequestPermissionResolvers, 'resolve').and.returnValue(Promise.resolve({}));

      const path = await RequestStore.resolvePath({
        resource: 'npc', method: 'POST', quantityType: 'single', params: { gameSlug: 'demo', id: '2' },
      });

      expect(RequestPermissionResolvers.resolve).toHaveBeenCalledWith('npc', 'single', { gameSlug: 'demo', id: '2' });
      expect(path).toBe('/games/demo/npcs/2/photo_upload.json');
    });

    it('rejects when no config exists for the given method/resource/quantity-type', async function() {
      await expectAsync(RequestStore.resolvePath({
        resource: 'npc', method: 'DELETE', quantityType: 'single', params: {},
      })).toBeRejected();
    });
  });

  describe('#purge', function() {
    it('deletes a settled request so a later ensure() starts a fresh Request instance', async function() {
      spyOn(RequestPermissionResolvers, 'resolve').and.returnValue(Promise.resolve({}));
      const ensureSpy = spyOn(Request.prototype, 'ensure').and.returnValue(Promise.resolve({ data: {} }));
      spyOn(Request.prototype, 'isOngoing').and.returnValue(false);

      await RequestStore.ensure({
        componentName: 'NpcListPageController', resource: 'npc', quantityType: 'collection', params: { gameSlug: 'demo' },
      });

      RequestStore.purge({ resource: 'npc' });

      await RequestStore.ensure({
        componentName: 'NpcListPageController', resource: 'npc', quantityType: 'collection', params: { gameSlug: 'demo' },
      });

      const objects = ensureSpy.calls.all().map((call) => call.object);
      expect(objects[0]).not.toBe(objects[1]);
    });

    it('restarts (without discarding) an ongoing request instead of deleting it', async function() {
      spyOn(RequestPermissionResolvers, 'resolve').and.returnValue(Promise.resolve({ can_edit: true }));
      const ensureSpy = spyOn(Request.prototype, 'ensure').and.returnValue(Promise.resolve({ data: {} }));
      spyOn(Request.prototype, 'isOngoing').and.returnValue(true);
      const restartSpy = spyOn(Request.prototype, 'restart');

      await RequestStore.ensure({
        componentName: 'NpcListPageController', resource: 'npc', quantityType: 'collection', params: { gameSlug: 'demo' },
      });
      ensureSpy.calls.reset();

      RequestStore.purge({ resource: 'npc' });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(restartSpy).toHaveBeenCalled();
      expect(ensureSpy).toHaveBeenCalledWith({
        permissions: { can_edit: true }, params: { gameSlug: 'demo' }, query: {},
      });
    });

    it('leaves requests for other resources untouched', async function() {
      spyOn(RequestPermissionResolvers, 'resolve').and.returnValue(Promise.resolve({}));
      const ensureSpy = spyOn(Request.prototype, 'ensure').and.returnValue(Promise.resolve({ data: {} }));
      spyOn(Request.prototype, 'isOngoing').and.returnValue(false);

      await RequestStore.ensure({
        componentName: 'NpcListPageController', resource: 'pc', quantityType: 'single', params: { gameSlug: 'demo', id: '1' },
      });

      RequestStore.purge({ resource: 'npc' });

      await RequestStore.ensure({
        componentName: 'NpcListPageController', resource: 'pc', quantityType: 'single', params: { gameSlug: 'demo', id: '1' },
      });

      const objects = ensureSpy.calls.all().map((call) => call.object);
      expect(objects[0]).toBe(objects[1]);
    });

    it('does nothing when no request has ever been made for the resource', function() {
      expect(() => RequestStore.purge({ resource: 'npc' })).not.toThrow();
    });
  });

  describe('#resyncPermissions', function() {
    it('re-resolves permissions and re-invokes ensure for every held request', async function() {
      spyOn(RequestPermissionResolvers, 'resolve').and.returnValue(Promise.resolve({ can_edit: false }));
      const ensureSpy = spyOn(Request.prototype, 'ensure').and.returnValue(Promise.resolve({ data: {} }));

      await RequestStore.ensure({
        componentName: 'NpcListPageController', resource: 'npc', quantityType: 'collection', params: { gameSlug: 'demo' },
      });
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

      await RequestStore.ensure({
        componentName: 'NpcListPageController', resource: 'npc', quantityType: 'collection', params: { gameSlug: 'demo' },
      });

      RequestStore.reset();

      expect(abortSpy).toHaveBeenCalled();

      await RequestStore.ensure({
        componentName: 'NpcListPageController', resource: 'npc', quantityType: 'collection', params: { gameSlug: 'demo' },
      });

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
