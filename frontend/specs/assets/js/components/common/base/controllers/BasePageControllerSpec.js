import BasePageController from '../../../../../../../assets/js/components/common/base/controllers/BasePageController.js';

describe('BasePageController', function() {
  it('only sets value while mounted', function() {
    const setter = jasmine.createSpy('setter');
    let mounted = true;
    const safeSet = new BasePageController().buildSafeSetter(() => mounted);

    safeSet(setter, 'value');
    mounted = false;
    safeSet(setter, 'other');

    expect(setter.calls.allArgs()).toEqual([['value']]);
  });

  describe('#redirectTo', function() {
    let originalWindow;

    beforeEach(function() {
      originalWindow = globalThis.window;
    });

    afterEach(function() {
      globalThis.window = originalWindow;
    });

    it('sets window.location.hash when window is defined', function() {
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      new BasePageController().redirectTo('/games/demo');

      expect(fakeWindow.location.hash).toBe('/games/demo');
    });

    it('does nothing when window is undefined', function() {
      globalThis.window = undefined;

      expect(() => new BasePageController().redirectTo('/games/demo')).not.toThrow();
    });
  });
});
