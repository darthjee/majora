import StlModelEditController
  from '../../../../../../../../../assets/js/components/resources/stl_model/pages/controllers/StlModelEditController.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('StlModelEditController', function() {
  describe('#submitForm', function() {
    let setStlModel;
    let setLoading;
    let setError;
    let setFieldErrors;
    let setStatus;

    beforeEach(function() {
      setStlModel = jasmine.createSpy('setStlModel');
      setLoading = jasmine.createSpy('setLoading');
      setError = jasmine.createSpy('setError');
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 1, name: 'Goblin Miniature' }),
      }));
    });

    const buildFormValues = (overrides = {}) => ({
      name: 'Goblin Miniature', owned: true, type: 'creature', race: '', role: '', ...overrides,
    });

    it('prevents default, resets status/errors, and submits the fields payload', async function() {
      const controller = new StlModelEditController(setStlModel, setLoading, setError, setFieldErrors);
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          event,
          '1',
          buildFormValues(),
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(RequestStore.mutate).toHaveBeenCalledWith({
          componentName: 'StlModelEditController',
          resource: 'stlModel',
          method: 'PATCH',
          quantityType: 'single',
          params: { id: '1' },
          body: {
            name: 'Goblin Miniature', owned: true, type: 'creature', race: null, role: null,
          },
        });
      } finally {
        delete globalThis.window;
      }
    });

    it('converts blank race/role selections to null', async function() {
      const controller = new StlModelEditController(setStlModel, setLoading, setError, setFieldErrors);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          '1',
          buildFormValues({ race: '', role: '' }),
          { setStatus, setFieldErrors },
        );

        expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
          body: jasmine.objectContaining({ race: null, role: null }),
        }));
      } finally {
        delete globalThis.window;
      }
    });

    it('sends non-blank race/role selections as-is', async function() {
      const controller = new StlModelEditController(setStlModel, setLoading, setError, setFieldErrors);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          '1',
          buildFormValues({ race: 'elf', role: 'wizard' }),
          { setStatus, setFieldErrors },
        );

        expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
          body: jasmine.objectContaining({ race: 'elf', role: 'wizard' }),
        }));
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the STL model detail page on success', async function() {
      const controller = new StlModelEditController(setStlModel, setLoading, setError, setFieldErrors);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          '5',
          buildFormValues(),
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/miniatures/stl_models/5');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets field errors on a 400 response', async function() {
      RequestStore.mutate.and.returnValue(Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ errors: { name: ['is too short'] } }),
      }));

      const controller = new StlModelEditController(setStlModel, setLoading, setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        '1',
        buildFormValues({ name: 'X' }),
        { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ name: ['is too short'] });
    });

    it('sets status to error on a non-400 failure', async function() {
      RequestStore.mutate.and.returnValue(Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new StlModelEditController(setStlModel, setLoading, setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        '1',
        buildFormValues(),
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the network request throws', async function() {
      RequestStore.mutate.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new StlModelEditController(setStlModel, setLoading, setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        '1',
        buildFormValues(),
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });
  });
});
