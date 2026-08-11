import StlModelEditController
  from '../../../../../../../../../assets/js/components/resources/stl_model/pages/controllers/StlModelEditController.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildStlModel } from '../../../../../../../../support/factories.js';

describe('StlModelEditController', function() {
  let ensureSpy;

  beforeEach(function() {
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(
      Promise.resolve({ data: buildStlModel({ id: 1, name: 'Goblin Miniature' }) }),
    );
  });

  describe('#buildEffect', function() {
    let setStlModel;
    let setLoading;
    let setError;
    let fakeWindow;

    beforeEach(function() {
      setStlModel = jasmine.createSpy('setStlModel');
      setLoading = jasmine.createSpy('setLoading');
      setError = jasmine.createSpy('setError');
      spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(true));
      fakeWindow = { location: { hash: '#/miniatures/stl_models/1/edit' } };
      globalThis.window = fakeWindow;
    });

    afterEach(function() {
      delete globalThis.window;
    });

    const buildController = () => new StlModelEditController(setStlModel, setLoading, setError, Noop.noop);

    it('fetches the STL model through RequestStore and calls setStlModel with the result', async function() {
      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'StlModelEditController', resource: 'stlModel', quantityType: 'single', params: { id: '1' },
      });
      expect(setStlModel).toHaveBeenCalledWith(buildStlModel({ id: 1, name: 'Goblin Miniature' }));
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets error when the STL model fetch fails', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setStlModel).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith('Unable to load STL model.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('redirects to the STL models index and does not fetch when the user is neither staff nor a '
      + 'superuser', async function() {
      AccessStore.ensureStaffOrSuperUser.and.returnValue(Promise.resolve(false));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/miniatures/stl_models');
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    });
  });
});
