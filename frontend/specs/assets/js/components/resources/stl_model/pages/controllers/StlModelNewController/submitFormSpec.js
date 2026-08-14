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

    const buildFormValues = (overrides = {}) => ({
      name: 'Goblin',
      owned: true,
      type: 'creature',
      url: '',
      size: '',
      races: [],
      roles: [],
      tags: ['goblin', 'humanoid'],
      sources: [{ id: 1, name: 'Wyrmwood' }],
      collections: [{ id: 2, name: 'Dungeon Pack' }],
      photoFile: null,
      ...overrides,
    });

    it('prevents default, resets status/errors, and submits the full field payload', async function() {
      const controller = new StlModelNewController(setError, setFieldErrors);
      const event = jasmine.createSpyObj('event', ['preventDefault']);

      await controller.submitForm(
        event,
        buildFormValues(),
        { setStatus, setFieldErrors, setCreatedId },
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
        body: {
          name: 'Goblin',
          owned: true,
          type: 'creature',
          url: null,
          size: null,
          races: [],
          roles: [],
          tags: ['goblin', 'humanoid'],
          source_ids: [1],
          collection_ids: [2],
        },
      });
    });

    it('converts blank url/size selections to null', async function() {
      const controller = new StlModelNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        buildFormValues({ url: 'https://example.com/model', size: 'huge' }),
        { setStatus, setFieldErrors, setCreatedId },
      );

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        body: jasmine.objectContaining({ url: 'https://example.com/model', size: 'huge' }),
      }));
    });

    it('maps races/roles picks down to their raw db_value id', async function() {
      const controller = new StlModelNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        buildFormValues({
          races: [{ id: 'elf', name: 'Elf' }], roles: [{ id: 'wizard', name: 'Wizard' }],
        }),
        { setStatus, setFieldErrors, setCreatedId },
      );

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        body: jasmine.objectContaining({ races: ['elf'], roles: ['wizard'] }),
      }));
    });

    it('defaults tags/source_ids/collection_ids/races/roles to empty arrays when none are given', async function() {
      const controller = new StlModelNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        {
          name: 'Goblin', owned: true, type: 'creature', url: '', size: '', photoFile: null,
        },
        { setStatus, setFieldErrors, setCreatedId },
      );

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        body: jasmine.objectContaining({
          tags: [], source_ids: [], collection_ids: [], races: [], roles: [],
        }),
      }));
    });

    it('redirects to the new record\'s show page on 201 success with no photo picked', async function() {
      const controller = new StlModelNewController(setError, setFieldErrors);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          buildFormValues(),
          { setStatus, setFieldErrors, setCreatedId },
        );

        expect(fakeWindow.location.hash).toBe('/miniatures/stl_models/5');
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
        buildFormValues({ name: '' }),
        { setStatus, setFieldErrors, setCreatedId },
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
        buildFormValues(),
        { setStatus, setFieldErrors, setCreatedId },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error (instead of submitting) when the user is neither staff nor a superuser', async function() {
      AccessStore.ensureStaffOrSuperUser.and.returnValue(Promise.resolve(false));

      const controller = new StlModelNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        buildFormValues(),
        { setStatus, setFieldErrors, setCreatedId },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(RequestStore.mutate).not.toHaveBeenCalled();
    });

    it('sets status to error when the network request throws', async function() {
      RequestStore.mutate.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new StlModelNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        buildFormValues(),
        { setStatus, setFieldErrors, setCreatedId },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });
  });
});
