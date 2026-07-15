import GamePollNewController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GamePollNewController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';

describe('GamePollNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#submitForm', function() {
    let setError;
    let setFieldErrors;
    let setStatus;
    let pollClient;

    beforeEach(function() {
      setError = jasmine.createSpy('setError');
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      pollClient = jasmine.createSpyObj('pollClient', ['createPoll']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      pollClient.createPoll.and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ id: 7, title: 'Which tavern?' }),
      }));
    });

    it('prevents default, resets status/errors, and submits the filtered options payload', async function() {
      const controller = new GamePollNewController(setError, setFieldErrors, pollClient);
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          event,
          'demo',
          {
            title: 'Which tavern?',
            description: 'Pick one for tonight.',
            type: 'single',
            options: ['The Drunken Griffin', 'The Rusty Anchor', '   ', ''],
          },
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(pollClient.createPoll).toHaveBeenCalledWith('demo', 'tok-abc', {
          title: 'Which tavern?',
          description: 'Pick one for tonight.',
          type: 'single',
          options: [{ option: 'The Drunken Griffin' }, { option: 'The Rusty Anchor' }],
        });
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the new poll detail page on success', async function() {
      const controller = new GamePollNewController(setError, setFieldErrors, pollClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          {
            title: 'Which tavern?', description: '', type: 'single', options: ['Griffin', ''],
          },
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/games/demo/polls/7');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets field errors on a 400 response', async function() {
      pollClient.createPoll.and.returnValue(Promise.resolve({
        status: 400,
        json: () => Promise.resolve({ errors: { title: ['is required'] } }),
      }));

      const controller = new GamePollNewController(setError, setFieldErrors, pollClient);

      await controller.submitForm(
        undefined,
        'demo',
        {
          title: '', description: '', type: 'single', options: [''],
        },
        { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ title: ['is required'] });
    });

    it('sets status to error on a non-201/400 failure', async function() {
      pollClient.createPoll.and.returnValue(Promise.resolve({
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new GamePollNewController(setError, setFieldErrors, pollClient);

      await controller.submitForm(
        undefined,
        'demo',
        {
          title: 'Which tavern?', description: '', type: 'single', options: [''],
        },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the network request throws', async function() {
      pollClient.createPoll.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GamePollNewController(setError, setFieldErrors, pollClient);

      await controller.submitForm(
        undefined,
        'demo',
        {
          title: 'Which tavern?', description: '', type: 'single', options: [''],
        },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('does not throw when called without an event', async function() {
      const controller = new GamePollNewController(setError, setFieldErrors, pollClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          {
            title: 'Which tavern?', description: '', type: 'single', options: [''],
          },
          { setStatus, setFieldErrors },
        );

        expect(setStatus).toHaveBeenCalledWith('submitting');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
