import GameDocumentNewController
  from '../../../../../../../../../assets/js/components/resources/document/pages/controllers/GameDocumentNewController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('GameDocumentNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#submitForm', function() {
    let setFieldErrors;
    let setStatus;
    let gameClient;

    beforeEach(function() {
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      gameClient = jasmine.createSpyObj('gameClient', ['createDocument']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      gameClient.createDocument.and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({
          id: 5, name: 'Ancient Scroll', description: '', photo_path: null, hidden: false,
        }),
      }));
    });

    it('prevents default, resets status/errors, and submits the fields payload', async function() {
      const controller = new GameDocumentNewController(Noop.noop, setFieldErrors, gameClient);
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          event,
          'demo',
          { name: 'Ancient Scroll', description: 'A crumbling scroll.', hidden: true },
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(gameClient.createDocument).toHaveBeenCalledWith(
          'demo',
          'tok-abc',
          { name: 'Ancient Scroll', description: 'A crumbling scroll.', hidden: true },
        );
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the documents list on success (no per-document detail page)', async function() {
      const controller = new GameDocumentNewController(Noop.noop, setFieldErrors, gameClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          { name: 'Ancient Scroll', description: '', hidden: false },
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/games/demo/documents');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets field errors on a 400 response', async function() {
      gameClient.createDocument.and.returnValue(Promise.resolve({
        status: 400,
        json: () => Promise.resolve({ errors: { name: ['is required'] } }),
      }));

      const controller = new GameDocumentNewController(Noop.noop, setFieldErrors, gameClient);

      await controller.submitForm(
        undefined,
        'demo',
        { name: '', description: '', hidden: false },
        { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ name: ['is required'] });
    });

    it('sets status to error on a non-201/400 failure', async function() {
      gameClient.createDocument.and.returnValue(Promise.resolve({
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new GameDocumentNewController(Noop.noop, setFieldErrors, gameClient);

      await controller.submitForm(
        undefined,
        'demo',
        { name: 'Ancient Scroll', description: '', hidden: false },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the network request throws', async function() {
      gameClient.createDocument.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameDocumentNewController(Noop.noop, setFieldErrors, gameClient);

      await controller.submitForm(
        undefined,
        'demo',
        { name: 'Ancient Scroll', description: '', hidden: false },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('does not throw when called without an event', async function() {
      const controller = new GameDocumentNewController(Noop.noop, setFieldErrors, gameClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          { name: 'Ancient Scroll', description: '', hidden: false },
          { setStatus, setFieldErrors },
        );

        expect(setStatus).toHaveBeenCalledWith('submitting');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
