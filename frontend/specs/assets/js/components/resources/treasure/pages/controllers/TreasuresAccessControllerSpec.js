import TreasuresAccessController
  from '../../../../../../../../assets/js/components/resources/treasure/pages/controllers/TreasuresAccessController.js';
import AccessStore from '../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('TreasuresAccessController', function() {
  it('sets allowed to true when the requester is staff or a superuser', async function() {
    const setAllowed = jasmine.createSpy('setAllowed');
    spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(true));

    const cleanup = new TreasuresAccessController(setAllowed).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setAllowed).toHaveBeenCalledWith(true);

    cleanup();
  });

  it('redirects to home and does not set allowed when the requester is neither staff nor a superuser',
    async function() {
      const setAllowed = jasmine.createSpy('setAllowed');
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;
      spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(false));

      try {
        const cleanup = new TreasuresAccessController(setAllowed).buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/');
        expect(setAllowed).not.toHaveBeenCalled();

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });

  it('does not update state after unmount', async function() {
    const setAllowed = jasmine.createSpy('setAllowed');
    spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(true));

    const cleanup = new TreasuresAccessController(setAllowed).buildEffect()();
    cleanup();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setAllowed).not.toHaveBeenCalled();
  });

  it('defaults setAllowed to a no-op', function() {
    expect(() => new TreasuresAccessController()).not.toThrow();
  });
});
