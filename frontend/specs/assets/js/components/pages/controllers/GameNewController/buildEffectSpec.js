import GameNewController
  from '../../../../../../../assets/js/components/pages/controllers/GameNewController.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import { buildContext } from './support.js';

describe('GameNewController', function() {
  let setError;
  let setFieldErrors;
  let gameClient;

  beforeEach(function() {
    ({ setError, setFieldErrors, gameClient } = buildContext());
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    it('redirects to register when no token is present', function() {
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      const controller = new GameNewController(setError, setFieldErrors, gameClient);

      try {
        controller.buildEffect()();

        expect(fakeWindow.location.hash).toBe('/users/register');
      } finally {
        delete globalThis.window;
      }
    });

    it('does not redirect when a token is present', function() {
      AuthStorage.setToken('tok-abc');
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      const controller = new GameNewController(setError, setFieldErrors, gameClient);

      try {
        controller.buildEffect()();

        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
