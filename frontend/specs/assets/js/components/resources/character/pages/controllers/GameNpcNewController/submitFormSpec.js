import GameNpcNewController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/GameNpcNewController.js';
import RequestStore
  from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GameNpcNewController', function() {
  describe('#submitForm', function() {
    let setError;
    let setFieldErrors;
    let setStatus;
    let characterClient;

    beforeEach(function() {
      setError = jasmine.createSpy('setError');
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      characterClient = jasmine.createSpyObj('characterClient', ['createNpc']);
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ id: 7, name: 'Goblin King', game_slug: 'demo' }),
      }));
    });

    it('prevents default, resets status/errors, and submits the fields payload', async function() {
      const controller = new GameNpcNewController(setError, setFieldErrors, characterClient);
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          event,
          'demo',
          {
            name: 'Goblin King',
            role: 'Villain',
            description: 'A menacing goblin.',
            privateDescription: 'Secretly a coward.',
            hidden: true,
            money: '42',
            allegiance: 'ally',
            publicAllegiance: 'enemy',
            links: [{ text: 'Wiki', url: 'https://example.com/wiki' }],
          },
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(RequestStore.mutate).toHaveBeenCalledWith({
          componentName: 'GameNpcNewController',
          resource: 'npc',
          method: 'POST',
          quantityType: 'collection',
          params: { gameSlug: 'demo' },
          body: {
            name: 'Goblin King',
            role: 'Villain',
            public_description: 'A menacing goblin.',
            private_description: 'Secretly a coward.',
            hidden: true,
            money: 42,
            allegiance: 'ally',
            public_allegiance: 'enemy',
            links: [{ text: 'Wiki', url: 'https://example.com/wiki' }],
          },
        });
      } finally {
        delete globalThis.window;
      }
    });

    it('defaults links to an empty array when not provided in formValues', async function() {
      const controller = new GameNpcNewController(setError, setFieldErrors, characterClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          {
            name: 'Goblin King', role: '', description: '', privateDescription: '', hidden: false, money: '0',
          },
          { setStatus, setFieldErrors },
        );

        expect(RequestStore.mutate).toHaveBeenCalledWith(
          jasmine.objectContaining({ body: jasmine.objectContaining({ links: [] }) }),
        );
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the new NPC detail page on success', async function() {
      const controller = new GameNpcNewController(setError, setFieldErrors, characterClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          {
            name: 'Goblin King', role: '', description: '', privateDescription: '', hidden: false, money: '0',
          },
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/games/demo/npcs/7');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets field errors on a 400 response', async function() {
      RequestStore.mutate.and.returnValue(Promise.resolve({
        status: 400,
        json: () => Promise.resolve({ errors: { name: ['is required'] } }),
      }));

      const controller = new GameNpcNewController(setError, setFieldErrors, characterClient);

      await controller.submitForm(
        undefined,
        'demo',
        { name: '', role: '', description: '', privateDescription: '', hidden: false, money: '0' },
        { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ name: ['is required'] });
    });

    it('sets status to error on a non-201/400 failure', async function() {
      RequestStore.mutate.and.returnValue(Promise.resolve({
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new GameNpcNewController(setError, setFieldErrors, characterClient);

      await controller.submitForm(
        undefined,
        'demo',
        {
          name: 'Goblin King', role: '', description: '', privateDescription: '', hidden: false, money: '0',
        },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the network request throws', async function() {
      RequestStore.mutate.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameNpcNewController(setError, setFieldErrors, characterClient);

      await controller.submitForm(
        undefined,
        'demo',
        {
          name: 'Goblin King', role: '', description: '', privateDescription: '', hidden: false, money: '0',
        },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('does not call setCharacterId or the upload client when no photoFile is provided', async function() {
      const setCharacterId = jasmine.createSpy('setCharacterId');
      const uploadClient = jasmine.createSpyObj('uploadClient', ['initUpload', 'submitUpload']);
      const controller = new GameNpcNewController(setError, setFieldErrors, characterClient, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          {
            name: 'Goblin King', role: '', description: '', privateDescription: '', hidden: false, money: '0',
          },
          { setStatus, setFieldErrors, setCharacterId },
        );

        expect(uploadClient.initUpload).not.toHaveBeenCalled();
        expect(setCharacterId).not.toHaveBeenCalled();
        expect(fakeWindow.location.hash).toBe('/games/demo/npcs/7');
      } finally {
        delete globalThis.window;
      }
    });

    it('does not throw when called without an event', async function() {
      const controller = new GameNpcNewController(setError, setFieldErrors, characterClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          {
            name: 'Goblin King', role: '', description: '', privateDescription: '', hidden: false, money: '0',
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
