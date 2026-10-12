import { buildSetters, buildMountedController } from './support.js';

describe('StaffCopiesController', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/staff/copies?type=items&from=source-game&to=target-game&page=3' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  describe('#changeSelection', function() {
    it('rewrites the hash keeping the other selectors and dropping pagination', function() {
      const controller = buildMountedController(buildSetters());

      controller.changeSelection('to', 'other-game');

      expect(globalThis.window.location.hash).toBe('/staff/copies?type=items&from=source-game&to=other-game');
    });

    it('omits a cleared selector', function() {
      const controller = buildMountedController(buildSetters());

      controller.changeSelection('from', '');

      expect(globalThis.window.location.hash).toBe('/staff/copies?type=items&to=target-game');
    });
  });
});
