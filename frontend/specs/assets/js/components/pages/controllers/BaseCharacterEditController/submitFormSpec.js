import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import { TestCharacterEditController, buildContext } from './support.js';

describe('BaseCharacterEditController', function() {
  let setCharacter;
  let setLoading;
  let setError;
  let setFieldErrors;
  let client;
  let characterClient;

  afterEach(function() {
    AuthStorage.clearToken();
  });

  beforeEach(function() {
    ({ setCharacter, setLoading, setError, setFieldErrors, client, characterClient } = buildContext());
  });

  describe('#submitForm', function() {
    let setStatus;

    beforeEach(function() {
      setStatus = jasmine.createSpy('setStatus');
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-test');
      characterClient.updateNpc.and.returnValue(Promise.resolve({
        ok: true, status: 200, json: () => Promise.resolve({ id: 1, can_edit: true }),
      }));
    });

    it('prevents default, resets status/errors, and submits the built fields payload', async function() {
      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
      );
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          event, 'demo', '1',
          {
            name: 'Test Hero',
            role: 'Fighter',
            description: 'A brave hero', privateDescription: 'DM notes',
            money: '310',
          },
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(characterClient.updateNpc).toHaveBeenCalledWith(
          'demo', '1', 'tok-test',
          {
            name: 'Test Hero',
            role: 'Fighter',
            public_description: 'A brave hero', private_description: 'DM notes',
            money: 310,
          },
        );
      } finally {
        delete globalThis.window;
      }
    });

    it('sets per-field errors on a 400 response without redirecting', async function() {
      characterClient.updateNpc.and.returnValue(Promise.resolve({
        ok: false, status: 400,
        json: () => Promise.resolve({ errors: { role: ['is invalid'] } }),
      }));

      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined, 'demo', '1',
          { name: '', role: '', description: '', privateDescription: '' },
          { setStatus, setFieldErrors },
        );

        expect(setFieldErrors).toHaveBeenCalledWith({ role: ['is invalid'] });
        expect(setError).not.toHaveBeenCalled();
        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status to error on a non-400 failure response without redirecting', async function() {
      characterClient.updateNpc.and.returnValue(Promise.resolve({
        ok: false, status: 500,
        json: () => Promise.resolve({ errors: {} }),
      }));

      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined, 'demo', '1',
          { name: '', role: '', description: '', privateDescription: '' },
          { setStatus, setFieldErrors },
        );

        expect(setStatus).toHaveBeenCalledWith('error');
        expect(setError).not.toHaveBeenCalled();
        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status to error when the request throws', async function() {
      characterClient.updateNpc.and.returnValue(Promise.reject(new Error('network')));

      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, setFieldErrors, client, characterClient,
      );

      await controller.submitForm(
        undefined, 'demo', '1',
        { name: '', role: '', description: '', privateDescription: '' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(setError).not.toHaveBeenCalled();
    });
  });
});
