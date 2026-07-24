import TreasureNewController
  from '../../../../../../../../../assets/js/components/resources/treasure/pages/controllers/TreasureNewController.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildContext, stubAccessStore } from './support.js';

describe('TreasureNewController', function() {
  let setError;
  let setFieldErrors;
  let setStatus;

  beforeEach(function() {
    ({ setError, setFieldErrors, setStatus } = buildContext());
  });

  describe('#submitForm', function() {
    beforeEach(function() {
      stubAccessStore(true);
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ id: 5 }),
      }));
    });

    it('prevents default, resets status/errors, and submits the fields payload', async function() {
      const controller = new TreasureNewController(setError, setFieldErrors);
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          event,
          { name: 'Sword', value: '100', gameType: 'dnd' },
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(RequestStore.mutate).toHaveBeenCalledWith({
          componentName: 'TreasureNewController',
          resource: 'treasure',
          method: 'POST',
          quantityType: 'collection',
          params: {},
          body: { name: 'Sword', value: 100, game_type: 'dnd' },
        });
      } finally {
        delete globalThis.window;
      }
    });

    it('parses value as integer before submission', async function() {
      const controller = new TreasureNewController(setError, setFieldErrors);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          { name: 'Ring', value: '250', gameType: 'deadlands' },
          { setStatus, setFieldErrors },
        );

        expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
          body: { name: 'Ring', value: 250, game_type: 'deadlands' },
        }));
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the treasure detail page on 201 success', async function() {
      const controller = new TreasureNewController(setError, setFieldErrors);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          { name: 'Sword', value: '100' },
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/treasures/5');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets field errors on a 400 response', async function() {
      RequestStore.mutate.and.returnValue(Promise.resolve({
        status: 400,
        json: () => Promise.resolve({ errors: { name: ['is too short'] } }),
      }));

      const controller = new TreasureNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        { name: 'X', value: '1' },
        { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ name: ['is too short'] });
    });

    it('sets status to error on a non-400 failure', async function() {
      RequestStore.mutate.and.returnValue(Promise.resolve({
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new TreasureNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        { name: 'Sword', value: '100' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('redirects to home when the user is neither staff nor a superuser', async function() {
      AccessStore.ensureStaffOrSuperUser.and.returnValue(Promise.resolve(false));
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      const controller = new TreasureNewController(setError, setFieldErrors);

      try {
        await controller.submitForm(
          undefined,
          { name: 'Sword', value: '100' },
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/');
        expect(RequestStore.mutate).not.toHaveBeenCalled();
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status to error when the network request throws', async function() {
      RequestStore.mutate.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new TreasureNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        { name: 'Sword', value: '100' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });
  });
});
