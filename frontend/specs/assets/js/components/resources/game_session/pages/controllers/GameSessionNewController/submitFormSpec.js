import GameSessionNewController
  from '../../../../../../../../../assets/js/components/resources/game_session/pages/controllers/GameSessionNewController.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GameSessionNewController', function() {
  describe('#submitForm', function() {
    let setError;
    let setFieldErrors;
    let setStatus;

    beforeEach(function() {
      setError = jasmine.createSpy('setError');
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ id: 7, title: 'Session 1', game_slug: 'demo' }),
      }));
    });

    it('prevents default, resets status/errors, and submits the fields payload', async function() {
      const controller = new GameSessionNewController(setError, setFieldErrors);
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          event,
          'demo',
          { title: 'Session 1', date: '2024-01-01', description: 'A thrilling encounter.' },
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(RequestStore.mutate).toHaveBeenCalledWith({
          componentName: 'GameSessionNewController',
          resource: 'session',
          method: 'POST',
          quantityType: 'collection',
          params: { gameSlug: 'demo' },
          body: { title: 'Session 1', date: '2024-01-01', description: 'A thrilling encounter.' },
        });
      } finally {
        delete globalThis.window;
      }
    });

    it('sends null when the date field is empty', async function() {
      const controller = new GameSessionNewController(setError, setFieldErrors);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          { title: 'Session 1', date: '', description: '' },
          { setStatus, setFieldErrors },
        );

        expect(RequestStore.mutate).toHaveBeenCalledWith({
          componentName: 'GameSessionNewController',
          resource: 'session',
          method: 'POST',
          quantityType: 'collection',
          params: { gameSlug: 'demo' },
          body: { title: 'Session 1', date: null, description: null },
        });
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the new session detail page on success', async function() {
      const controller = new GameSessionNewController(setError, setFieldErrors);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          { title: 'Session 1', date: '' },
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/games/demo/sessions/7');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets field errors on a 400 response', async function() {
      RequestStore.mutate.and.returnValue(Promise.resolve({
        status: 400,
        json: () => Promise.resolve({ errors: { title: ['is required'] } }),
      }));

      const controller = new GameSessionNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        'demo',
        { title: '', date: '' },
        { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ title: ['is required'] });
    });

    it('sets status to error on a non-201/400 failure', async function() {
      RequestStore.mutate.and.returnValue(Promise.resolve({
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new GameSessionNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        'demo',
        { title: 'Session 1', date: '' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the network request throws', async function() {
      RequestStore.mutate.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameSessionNewController(setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        'demo',
        { title: 'Session 1', date: '' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('does not throw when called without an event', async function() {
      const controller = new GameSessionNewController(setError, setFieldErrors);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          { title: 'Session 1', date: '' },
          { setStatus, setFieldErrors },
        );

        expect(setStatus).toHaveBeenCalledWith('submitting');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
