import CollectionNewController
  from '../../../../../../../../../assets/js/components/resources/collection/pages/controllers/CollectionNewController.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildContext, stubAccessStore } from './support.js';

describe('CollectionNewController', function() {
  let setError;
  let setFieldErrors;
  let setStatus;
  let setCreatedId;
  let onSuccess;

  beforeEach(function() {
    ({
      setError, setFieldErrors, setStatus, setCreatedId, onSuccess,
    } = buildContext());
  });

  describe('#submitForm', function() {
    beforeEach(function() {
      stubAccessStore(true);
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ id: 5, name: 'Goblin Pack', url: '' }),
      }));
    });

    it('prevents default, resets status/errors, and submits the name/url payload', async function() {
      const controller = new CollectionNewController(setError, setFieldErrors);
      const event = jasmine.createSpyObj('event', ['preventDefault']);

      await controller.submitForm(
        event,
        { name: 'Goblin Pack', url: 'http://example.com', photoFile: null },
        {
          setStatus, setFieldErrors, setCreatedId, onSuccess,
        },
      );

      expect(event.preventDefault).toHaveBeenCalled();
      expect(setStatus).toHaveBeenCalledWith('submitting');
      expect(setFieldErrors).toHaveBeenCalledWith({});
      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'CollectionNewController',
        resource: 'collection',
        method: 'POST',
        quantityType: 'collection',
        params: {},
        body: { name: 'Goblin Pack', url: 'http://example.com' },
      });
    });

    it('defaults url to an empty string when none is given', async function() {
      const controller = new CollectionNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        { name: 'Goblin Pack', photoFile: null },
        {
          setStatus, setFieldErrors, setCreatedId, onSuccess,
        },
      );

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        body: { name: 'Goblin Pack', url: '' },
      }));
    });

    it('calls onSuccess with the created id on 201 success with no photo picked', async function() {
      const controller = new CollectionNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        { name: 'Goblin Pack', url: '', photoFile: null },
        {
          setStatus, setFieldErrors, setCreatedId, onSuccess,
        },
      );

      expect(onSuccess).toHaveBeenCalledWith(5);
    });

    it('sets field errors on a 400 response', async function() {
      RequestStore.mutate.and.returnValue(Promise.resolve({
        status: 400,
        json: () => Promise.resolve({ errors: { name: ['is required'] } }),
      }));

      const controller = new CollectionNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        { name: '', url: '', photoFile: null },
        {
          setStatus, setFieldErrors, setCreatedId, onSuccess,
        },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ name: ['is required'] });
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('sets status to error on a non-400 failure', async function() {
      RequestStore.mutate.and.returnValue(Promise.resolve({
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new CollectionNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        { name: 'Goblin Pack', url: '', photoFile: null },
        {
          setStatus, setFieldErrors, setCreatedId, onSuccess,
        },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('sets status to error (instead of navigating away) when the user is neither staff nor a superuser', async function() {
      AccessStore.ensureStaffOrSuperUser.and.returnValue(Promise.resolve(false));

      const controller = new CollectionNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        { name: 'Goblin Pack', url: '', photoFile: null },
        {
          setStatus, setFieldErrors, setCreatedId, onSuccess,
        },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(RequestStore.mutate).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('sets status to error when the network request throws', async function() {
      RequestStore.mutate.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new CollectionNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        { name: 'Goblin Pack', url: '', photoFile: null },
        {
          setStatus, setFieldErrors, setCreatedId, onSuccess,
        },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });
  });
});
