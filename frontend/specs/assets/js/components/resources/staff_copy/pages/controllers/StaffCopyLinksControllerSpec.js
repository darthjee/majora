import StaffCopyLinksController from '../../../../../../../../assets/js/components/resources/staff_copy/pages/controllers/StaffCopyLinksController.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('StaffCopyLinksController', function() {
  let setters;
  let actions;
  let controller;
  let ensureSpy;
  let purgeSpy;
  const LINKS = [
    { upload_id: 1, upload_type: 'image', status: 'failed', error: 'source_missing', entity: { name: 'Sword' } },
    { upload_id: 2, upload_type: 'file', status: 'pending', error: null, entity: { name: 'Map' } },
  ];

  beforeEach(async function() {
    setters = {
      setLinks: jasmine.createSpy('setLinks'),
      setRetrying: jasmine.createSpy('setRetrying'),
      setLinkErrors: jasmine.createSpy('setLinkErrors'),
    };
    actions = jasmine.createSpyObj('actions', ['renew', 'link']);
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: LINKS }));
    purgeSpy = spyOn(RequestStore, 'purge');
    controller = new StaffCopyLinksController(setters, { actions, safeSet: (setter, value) => setter(value) });
    await controller.fetch('target-game');
  });

  describe('#fetch', function() {
    it('lists the links of the target game', function() {
      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'StaffCopiesController', resource: 'staffCopy', quantityType: 'links', query: { to: 'target-game' },
      });
      expect(setters.setLinks).toHaveBeenCalledWith(LINKS);
    });

    it('stores an empty list for a non-array body or an error', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: null }));
      await controller.fetch();
      expect(setters.setLinks).toHaveBeenCalledWith([]);

      ensureSpy.and.returnValue(Promise.reject(new Error('boom')));
      setters.setLinks.calls.reset();
      await controller.fetch();
      expect(setters.setLinks).toHaveBeenCalledWith([]);
    });
  });

  describe('#refresh', function() {
    it('purges and refetches the current target', async function() {
      await controller.refresh();

      expect(purgeSpy).toHaveBeenCalledWith({ resource: 'staffCopy' });
      expect(ensureSpy.calls.mostRecent().args[0].query).toEqual({ to: 'target-game' });
    });
  });

  describe('#retry', function() {
    it('renews then links with the new token and drops the row on success', async function() {
      actions.renew.and.returnValue(Promise.resolve({
        ok: true, status: 200, data: { upload_id: 1, upload_type: 'image', token: 'new' },
      }));
      actions.link.and.returnValue(Promise.resolve({ ok: true, status: 200 }));

      await controller.retry(LINKS[0]);

      expect(actions.renew).toHaveBeenCalledWith(1);
      expect(actions.link).toHaveBeenCalledWith({ upload_id: 1, upload_type: 'image', token: 'new' });
      expect(setters.setLinks).toHaveBeenCalledWith([LINKS[1]]);
      expect(setters.setRetrying.calls.allArgs()).toEqual([[[1]], [[]]]);
    });

    it('drops the row when renew answers 404', async function() {
      actions.renew.and.returnValue(Promise.resolve({ ok: false, status: 404, data: null }));

      await controller.retry(LINKS[0]);

      expect(actions.link).not.toHaveBeenCalled();
      expect(setters.setLinks).toHaveBeenCalledWith([LINKS[1]]);
    });

    it('drops the row when the link answers 404', async function() {
      actions.renew.and.returnValue(Promise.resolve({ ok: true, status: 200, data: { token: 'new' } }));
      actions.link.and.returnValue(Promise.resolve({ ok: false, status: 404 }));

      await controller.retry(LINKS[1]);

      expect(actions.link).toHaveBeenCalledWith({ upload_id: 2, upload_type: 'file', token: 'new' });
      expect(setters.setLinks).toHaveBeenCalledWith([LINKS[0]]);
    });

    it('shows the in-flight error when renew answers 409', async function() {
      actions.renew.and.returnValue(Promise.resolve({ ok: false, status: 409, data: null }));

      await controller.retry(LINKS[0]);

      expect(setters.setLinkErrors).toHaveBeenCalledWith({ 1: 'staff_copies_page.link_error.in_flight' });
    });

    it('shows the unknown error on another renew failure', async function() {
      actions.renew.and.returnValue(Promise.resolve({ ok: false, status: 500, data: null }));

      await controller.retry(LINKS[0]);

      expect(setters.setLinkErrors).toHaveBeenCalledWith({ 1: 'staff_copies_page.link_error.unknown' });
    });

    it('refetches the list when the link fails', async function() {
      actions.renew.and.returnValue(Promise.resolve({ ok: true, status: 200, data: { token: 'new' } }));
      actions.link.and.returnValue(Promise.resolve({ ok: false, status: 500 }));
      ensureSpy.calls.reset();

      await controller.retry(LINKS[0]);

      expect(purgeSpy).toHaveBeenCalledWith({ resource: 'staffCopy' });
      expect(ensureSpy).toHaveBeenCalledWith(jasmine.objectContaining({ quantityType: 'links' }));
    });

    it('ignores a second retry of a row already retrying', async function() {
      let resolveRenew;
      actions.renew.and.returnValue(new Promise((resolve) => { resolveRenew = resolve; }));

      const first = controller.retry(LINKS[0]);
      await controller.retry(LINKS[0]);
      resolveRenew({ ok: false, status: 404, data: null });
      await first;

      expect(actions.renew).toHaveBeenCalledTimes(1);
    });
  });
});
