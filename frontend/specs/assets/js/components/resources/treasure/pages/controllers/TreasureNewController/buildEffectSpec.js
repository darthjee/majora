import TreasureNewController
  from '../../../../../../../../../assets/js/components/resources/treasure/pages/controllers/TreasureNewController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/AuthStorage.js';
import { buildContext, stubAccessStore } from './support.js';

describe('TreasureNewController', function() {
  let setError;
  let setFieldErrors;
  let treasureClient;

  beforeEach(function() {
    ({ setError, setFieldErrors, treasureClient } = buildContext());
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    it('redirects to home when the user is not a superuser', async function() {
      stubAccessStore(false);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      const controller = new TreasureNewController(setError, setFieldErrors, treasureClient);

      try {
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/');
      } finally {
        delete globalThis.window;
      }
    });

    it('does not redirect when the user is a superuser', async function() {
      stubAccessStore(true);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      const controller = new TreasureNewController(setError, setFieldErrors, treasureClient);

      try {
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
