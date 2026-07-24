import TreasureNewController
  from '../../../../../../../../../assets/js/components/resources/treasure/pages/controllers/TreasureNewController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import { buildContext, stubAccessStore } from './support.js';

describe('TreasureNewController', function() {
  let setError;
  let setFieldErrors;

  beforeEach(function() {
    ({ setError, setFieldErrors } = buildContext());
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    it('redirects to home when the user is neither staff nor a superuser', async function() {
      stubAccessStore(false);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      const controller = new TreasureNewController(setError, setFieldErrors);

      try {
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/');
      } finally {
        delete globalThis.window;
      }
    });

    it('does not redirect when the user is staff or a superuser', async function() {
      stubAccessStore(true);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      const controller = new TreasureNewController(setError, setFieldErrors);

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
