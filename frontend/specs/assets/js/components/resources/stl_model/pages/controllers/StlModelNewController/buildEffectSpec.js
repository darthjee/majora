import StlModelNewController
  from '../../../../../../../../../assets/js/components/resources/stl_model/pages/controllers/StlModelNewController.js';
import { buildContext, stubAccessStore } from './support.js';

describe('StlModelNewController', function() {
  let setError;
  let setFieldErrors;

  beforeEach(function() {
    ({ setError, setFieldErrors } = buildContext());
  });

  describe('#buildEffect', function() {
    it('redirects to the STL models index when the user is neither staff nor a superuser', async function() {
      stubAccessStore(false);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      const controller = new StlModelNewController(setError, setFieldErrors);

      try {
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/miniatures/stl_models');
      } finally {
        delete globalThis.window;
      }
    });

    it('does not redirect when the user is staff or a superuser', async function() {
      stubAccessStore(true);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      const controller = new StlModelNewController(setError, setFieldErrors);

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
