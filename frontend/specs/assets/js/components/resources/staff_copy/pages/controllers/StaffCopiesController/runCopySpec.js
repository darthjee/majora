import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildSetters, buildMountedController, PAGINATION } from './support.js';

describe('StaffCopiesController', function() {
  let setters;
  let actions;
  let win;
  let ensureSpy;
  let purgeSpy;
  let originalWindow;
  const rows = [{ id: 1, name: 'Sword' }, { id: 2, name: 'Shield' }];

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/staff/copies' } };
    setters = buildSetters();
    actions = jasmine.createSpyObj('actions', ['copy', 'link']);
    win = jasmine.createSpyObj('win', ['addEventListener', 'removeEventListener']);
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: [], pagination: PAGINATION }));
    purgeSpy = spyOn(RequestStore, 'purge');
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  describe('#runCopy', function() {
    it('runs every row into the selected target and publishes the run', async function() {
      actions.copy.and.returnValue(Promise.resolve({ ok: true, status: 201, data: { links: [] } }));
      const controller = buildMountedController(setters, undefined, { actions, win });

      await controller.runCopy(rows);

      expect(actions.copy.calls.allArgs()).toEqual([['items', 1, 'target-game'], ['items', 2, 'target-game']]);
      expect(setters.setRun.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
        running: false, done: 2, total: 2,
      }));
    });

    it('guards beforeunload while running', async function() {
      let resolveCopy;
      actions.copy.and.returnValue(new Promise((resolve) => { resolveCopy = resolve; }));
      const controller = buildMountedController(setters, undefined, { actions, win });

      const promise = controller.runCopy([rows[0]]);

      expect(win.addEventListener).toHaveBeenCalledWith('beforeunload', jasmine.any(Function));
      expect(win.removeEventListener).not.toHaveBeenCalled();

      resolveCopy({ ok: true, status: 201, data: { links: [] } });
      await promise;

      expect(win.removeEventListener).toHaveBeenCalledWith('beforeunload', jasmine.any(Function));

      const event = jasmine.createSpyObj('event', ['preventDefault']);
      win.addEventListener.calls.mostRecent().args[1](event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.returnValue).toBe('');
    });

    it('purges the cache and refreshes the source list after the run, even on a 404', async function() {
      actions.copy.and.returnValue(Promise.resolve({ ok: false, status: 404, data: null }));
      const controller = buildMountedController(setters, undefined, { actions, win });

      await controller.runCopy(rows);

      expect(actions.copy).toHaveBeenCalledTimes(2);
      expect(purgeSpy).toHaveBeenCalledWith({ resource: 'staffCopy' });
      expect(ensureSpy).toHaveBeenCalledWith(jasmine.objectContaining({ quantityType: 'collection' }));
    });

    it('ignores run updates after unmount', async function() {
      let resolveCopy;
      actions.copy.and.returnValue(new Promise((resolve) => { resolveCopy = resolve; }));
      const controller = buildMountedController(setters, undefined, { actions, win });

      const promise = controller.runCopy([rows[0]]);
      const callsBefore = setters.setRun.calls.count();
      controller.mounted = false;
      resolveCopy({ ok: true, status: 201, data: { links: [] } });
      await promise;

      expect(setters.setRun.calls.count()).toBe(callsBefore);
      expect(setters.setRows).not.toHaveBeenCalled();
    });
  });
});
