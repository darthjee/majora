import TreasureNewController
  from '../../../../../../../assets/js/components/pages/controllers/TreasureNewController.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import { buildContext } from './support.js';

describe('TreasureNewController', function() {
  let setError;
  let setFieldErrors;
  let treasureClient;
  let authClient;

  beforeEach(function() {
    ({ setError, setFieldErrors, treasureClient, authClient } = buildContext());
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    it('redirects to home when the user is not a superuser', async function() {
      authClient.status.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ is_superuser: false }),
      }));
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      const controller = new TreasureNewController(
        setError, setFieldErrors, treasureClient, authClient,
      );

      try {
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/');
      } finally {
        delete globalThis.window;
      }
    });

    it('does not redirect when the user is a superuser', async function() {
      authClient.status.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ is_superuser: true }),
      }));
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      const controller = new TreasureNewController(
        setError, setFieldErrors, treasureClient, authClient,
      );

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
