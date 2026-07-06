import TreasureNewController
  from '../../../../../../../assets/js/components/pages/controllers/TreasureNewController.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import { buildContext } from './support.js';

describe('TreasureNewController', function() {
  let setError;
  let setFieldErrors;
  let setStatus;
  let treasureClient;
  let authClient;

  beforeEach(function() {
    ({ setError, setFieldErrors, setStatus, treasureClient, authClient } = buildContext());
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#submitForm', function() {
    beforeEach(function() {
      authClient.status.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ is_superuser: true }),
      }));
    });

    it('prevents default, resets status/errors, and submits the fields payload', async function() {
      AuthStorage.setToken('tok-abc');
      treasureClient.createTreasure.and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ id: 5 }),
      }));

      const controller = new TreasureNewController(
        setError, setFieldErrors, treasureClient, authClient,
      );
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          event,
          { name: 'Sword', value: '100' },
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(treasureClient.createTreasure).toHaveBeenCalledWith(
          'tok-abc',
          { name: 'Sword', value: 100 },
        );
      } finally {
        delete globalThis.window;
      }
    });

    it('parses value as integer before submission', async function() {
      AuthStorage.setToken('tok-abc');
      treasureClient.createTreasure.and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ id: 5 }),
      }));

      const controller = new TreasureNewController(
        setError, setFieldErrors, treasureClient, authClient,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          { name: 'Ring', value: '250' },
          { setStatus, setFieldErrors },
        );

        expect(treasureClient.createTreasure).toHaveBeenCalledWith(
          'tok-abc',
          { name: 'Ring', value: 250 },
        );
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the treasure detail page on 201 success', async function() {
      AuthStorage.setToken('tok-abc');
      treasureClient.createTreasure.and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ id: 7 }),
      }));

      const controller = new TreasureNewController(
        setError, setFieldErrors, treasureClient, authClient,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          { name: 'Sword', value: '100' },
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/treasures/7');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets field errors on a 400 response', async function() {
      AuthStorage.setToken('tok-abc');
      treasureClient.createTreasure.and.returnValue(Promise.resolve({
        status: 400,
        json: () => Promise.resolve({ errors: { name: ['is too short'] } }),
      }));

      const controller = new TreasureNewController(
        setError, setFieldErrors, treasureClient, authClient,
      );

      await controller.submitForm(
        undefined,
        { name: 'X', value: '1' },
        { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ name: ['is too short'] });
    });

    it('sets status to error on a non-400 failure', async function() {
      AuthStorage.setToken('tok-abc');
      treasureClient.createTreasure.and.returnValue(Promise.resolve({
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new TreasureNewController(
        setError, setFieldErrors, treasureClient, authClient,
      );

      await controller.submitForm(
        undefined,
        { name: 'Sword', value: '100' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

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
        await controller.submitForm(
          undefined,
          { name: 'Sword', value: '100' },
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/');
        expect(treasureClient.createTreasure).not.toHaveBeenCalled();
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status to error when the network request throws', async function() {
      AuthStorage.setToken('tok-abc');
      treasureClient.createTreasure.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new TreasureNewController(
        setError, setFieldErrors, treasureClient, authClient,
      );

      await controller.submitForm(
        undefined,
        { name: 'Sword', value: '100' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });
  });
});
