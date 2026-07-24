import GameDocumentNewController
  from '../../../../../../../../../assets/js/components/resources/document/pages/controllers/GameDocumentNewController.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('GameDocumentNewController', function() {
  describe('#submitForm', function() {
    let setFieldErrors;
    let setStatus;

    beforeEach(function() {
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({
          id: 5, name: 'Ancient Scroll', description: '', photo_path: null, hidden: false,
        }),
      }));
    });

    it('prevents default, resets status/errors, and submits the fields payload', async function() {
      const controller = new GameDocumentNewController(Noop.noop, setFieldErrors);
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
        expect(RequestStore.mutate).toHaveBeenCalledWith({
          componentName: 'GameDocumentNewController',
          resource: 'document',
          method: 'POST',
          quantityType: 'gameCollection',
          params: { gameSlug: 'demo' },
          body: { name: 'Ancient Scroll', description: 'A crumbling scroll.', hidden: true },
        });
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the documents list on success (no per-document detail page)', async function() {
      const controller = new GameDocumentNewController(Noop.noop, setFieldErrors);
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
      RequestStore.mutate.and.returnValue(Promise.resolve({
        status: 400,
        json: () => Promise.resolve({ errors: { name: ['is required'] } }),
      }));

      const controller = new GameDocumentNewController(Noop.noop, setFieldErrors);

      await controller.submitForm(
        undefined,
        'demo',
        { name: '', description: '', hidden: false },
        { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ name: ['is required'] });
    });

    it('sets status to error on a non-201/400 failure', async function() {
      RequestStore.mutate.and.returnValue(Promise.resolve({
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new GameDocumentNewController(Noop.noop, setFieldErrors);

      await controller.submitForm(
        undefined,
        'demo',
        { name: 'Ancient Scroll', description: '', hidden: false },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the network request throws', async function() {
      RequestStore.mutate.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameDocumentNewController(Noop.noop, setFieldErrors);

      await controller.submitForm(
        undefined,
        'demo',
        { name: 'Ancient Scroll', description: '', hidden: false },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('does not throw when called without an event', async function() {
      const controller = new GameDocumentNewController(Noop.noop, setFieldErrors);
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
