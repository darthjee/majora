import StaffStatisticsPageController
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/StaffStatisticsPageController.js';
import AccessStore from '../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import flushMicrotasks from '../../../../../../../support/flushMicrotasks.js';

describe('StaffStatisticsPageController', function() {
  let setAllowed;
  let originalWindow;

  beforeEach(function() {
    setAllowed = jasmine.createSpy('setAllowed');
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/staff/statistics' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  const run = async (result) => {
    spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(result);
    const cleanup = new StaffStatisticsPageController(setAllowed).buildEffect()();
    await flushMicrotasks();
    return cleanup;
  };

  it('allows staff or superusers', async function() {
    const cleanup = await run(Promise.resolve(true));

    expect(setAllowed).toHaveBeenCalledWith(true);
    expect(globalThis.window.location.hash).toBe('#/staff/statistics');
    cleanup();
  });

  it('redirects everyone else home', async function() {
    await run(Promise.resolve(false));

    expect(setAllowed).not.toHaveBeenCalled();
    expect(globalThis.window.location.hash).toBe('/');
  });

  it('redirects home when the check fails', async function() {
    await run(Promise.reject(new Error('boom')));

    expect(globalThis.window.location.hash).toBe('/');
  });

  it('does nothing after unmount', async function() {
    spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(false));
    new StaffStatisticsPageController(setAllowed).buildEffect()()();
    await flushMicrotasks();

    expect(globalThis.window.location.hash).toBe('#/staff/statistics');
  });

  it('does not redirect after unmount when the check fails', async function() {
    spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.reject(new Error('boom')));
    new StaffStatisticsPageController(setAllowed).buildEffect()()();
    await flushMicrotasks();

    expect(globalThis.window.location.hash).toBe('#/staff/statistics');
  });
});
