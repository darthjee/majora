import FactionNewController
  from '../../../../../../../../../assets/js/components/resources/faction/pages/controllers/FactionNewController.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildContext, stubAccessStore } from './support.js';

describe('FactionNewController', function() {
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
        json: () => Promise.resolve({ id: 5, name: 'The Silver Hand' }),
      }));
    });

    it('prevents default, resets status/errors, and submits the name payload', async function() {
      const controller = new FactionNewController(setError, setFieldErrors);
      const event = jasmine.createSpyObj('event', ['preventDefault']);

      await controller.submitForm(
        event,
        'demo',
        { name: 'The Silver Hand', photoFile: null },
        {
          setStatus, setFieldErrors, setCreatedId, onSuccess,
        },
      );

      expect(event.preventDefault).toHaveBeenCalled();
      expect(setStatus).toHaveBeenCalledWith('submitting');
      expect(setFieldErrors).toHaveBeenCalledWith({});
      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'FactionNewController',
        resource: 'faction',
        method: 'POST',
        quantityType: 'collection',
        params: { gameSlug: 'demo' },
        body: { name: 'The Silver Hand' },
      });
    });

    it('calls onSuccess with the created id on 201 success with no photo picked', async function() {
      const controller = new FactionNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        'demo',
        { name: 'The Silver Hand', photoFile: null },
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

      const controller = new FactionNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        'demo',
        { name: '', photoFile: null },
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

      const controller = new FactionNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        'demo',
        { name: 'The Silver Hand', photoFile: null },
        {
          setStatus, setFieldErrors, setCreatedId, onSuccess,
        },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('sets status to error (instead of navigating away) when the requester cannot create factions', async function() {
      AccessStore.ensureGamePermissions.and.returnValue(Promise.resolve({ can_create_faction: false }));

      const controller = new FactionNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        'demo',
        { name: 'The Silver Hand', photoFile: null },
        {
          setStatus, setFieldErrors, setCreatedId, onSuccess,
        },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(RequestStore.mutate).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('sets status to error when the permissions check rejects', async function() {
      AccessStore.ensureGamePermissions.and.returnValue(Promise.reject(new Error('nope')));

      const controller = new FactionNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        'demo',
        { name: 'The Silver Hand', photoFile: null },
        {
          setStatus, setFieldErrors, setCreatedId, onSuccess,
        },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(RequestStore.mutate).not.toHaveBeenCalled();
    });

    it('sets status to error when the network request throws', async function() {
      RequestStore.mutate.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new FactionNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        'demo',
        { name: 'The Silver Hand', photoFile: null },
        {
          setStatus, setFieldErrors, setCreatedId, onSuccess,
        },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });
  });
});
