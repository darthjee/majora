import StlModelNewController
  from '../../../../../../../../../assets/js/components/resources/stl_model/pages/controllers/StlModelNewController.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildContext, stubAccessStore } from './support.js';

describe('StlModelNewController', function() {
  let setError;
  let setFieldErrors;
  let setStatus;
  let setCreatedId;

  beforeEach(function() {
    ({
      setError, setFieldErrors, setStatus, setCreatedId,
    } = buildContext());
  });

  describe('#submitForm', function() {
    beforeEach(function() {
      stubAccessStore(true);
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ id: 5, name: 'Goblin', tags: [] }),
      }));
    });

    it('prevents default, resets status/errors, and submits the name/tags payload', async function() {
      const controller = new StlModelNewController(setError, setFieldErrors);
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          event,
          { name: 'Goblin', tags: ['goblin', 'humanoid'], photoFile: null },
          {
            setStatus, setFieldErrors, setCreatedId,
          },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(RequestStore.mutate).toHaveBeenCalledWith({
          componentName: 'StlModelNewController',
          resource: 'stlModel',
          method: 'POST',
          quantityType: 'collection',
          params: {},
          body: { name: 'Goblin', tags: ['goblin', 'humanoid'] },
        });
      } finally {
        delete globalThis.window;
      }
    });

    it('defaults tags to an empty array when none are given', async function() {
      const controller = new StlModelNewController(setError, setFieldErrors);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          { name: 'Goblin', photoFile: null },
          {
            setStatus, setFieldErrors, setCreatedId,
          },
        );

        expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
          body: { name: 'Goblin', tags: [] },
        }));
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the STL model detail page on 201 success with no photo picked', async function() {
      const controller = new StlModelNewController(setError, setFieldErrors);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          { name: 'Goblin', tags: [], photoFile: null },
          {
            setStatus, setFieldErrors, setCreatedId,
          },
        );

        expect(fakeWindow.location.hash).toBe('/stl_models/5');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets field errors on a 400 response', async function() {
      RequestStore.mutate.and.returnValue(Promise.resolve({
        status: 400,
        json: () => Promise.resolve({ errors: { name: ['is required'] } }),
      }));

      const controller = new StlModelNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        { name: '', tags: [], photoFile: null },
        {
          setStatus, setFieldErrors, setCreatedId,
        },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ name: ['is required'] });
    });

    it('sets status to error on a non-400 failure', async function() {
      RequestStore.mutate.and.returnValue(Promise.resolve({
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new StlModelNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        { name: 'Goblin', tags: [], photoFile: null },
        {
          setStatus, setFieldErrors, setCreatedId,
        },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('redirects to home when the user is neither staff nor a superuser', async function() {
      AccessStore.ensureStaffOrSuperUser.and.returnValue(Promise.resolve(false));
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      const controller = new StlModelNewController(setError, setFieldErrors);

      try {
        await controller.submitForm(
          undefined,
          { name: 'Goblin', tags: [], photoFile: null },
          {
            setStatus, setFieldErrors, setCreatedId,
          },
        );

        expect(fakeWindow.location.hash).toBe('/');
        expect(RequestStore.mutate).not.toHaveBeenCalled();
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status to error when the network request throws', async function() {
      RequestStore.mutate.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new StlModelNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        { name: 'Goblin', tags: [], photoFile: null },
        {
          setStatus, setFieldErrors, setCreatedId,
        },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });
  });
});
