import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import { KINDS } from './support.js';

KINDS.forEach(({ label, Controller, kind, name, role, description, allegiance, publicAllegiance }) => {
  describe(`${label}#submitForm`, function() {
    let setCharacter;
    let setLoading;
    let setError;
    let setFieldErrors;
    let setStatus;
    let client;
    let characterClient;

    afterEach(function() {
      AuthStorage.clearToken();
    });

    beforeEach(function() {
      setCharacter = jasmine.createSpy('setCharacter');
      setLoading = jasmine.createSpy('setLoading');
      setError = jasmine.createSpy('setError');
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      client = jasmine.createSpyObj('client', ['currentHash']);
      characterClient = jasmine.createSpyObj('characterClient', ['fetchCharacter', 'updateCharacter']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      characterClient.updateCharacter.and.returnValue(Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 2, can_edit: true }),
      }));
    });

    it('prevents default, resets status/errors, and submits the built fields payload', async function() {
      const controller = new Controller(
        setCharacter,
        setLoading,
        setError,
        setFieldErrors,
        client,
        characterClient,
      );
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        const links = [{ id: 5, text: 'Wiki', url: 'https://example.com/wiki', link_type: '' }];

        await controller.submitForm(
          event,
          'demo',
          '2',
          {
            name,
            role,
            description,
            privateDescription: 'Secret notes',
            money: '310',
            allegiance,
            publicAllegiance,
            links,
          },
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});

        const expectedFields = {
          name,
          role,
          public_description: description,
          private_description: 'Secret notes',
          money: 310,
          links: [{
            id: 5, text: 'Wiki', url: 'https://example.com/wiki', link_type: '', delete: false,
          }],
        };

        if (kind === 'npcs') {
          expectedFields.allegiance = allegiance;
          expectedFields.public_allegiance = publicAllegiance;
        }

        expect(characterClient.updateCharacter).toHaveBeenCalledWith(
          kind,
          'demo',
          '2',
          'tok-abc',
          expectedFields,
        );
      } finally {
        delete globalThis.window;
      }
    });

    it('does not throw when called without an event', async function() {
      const controller = new Controller(
        setCharacter,
        setLoading,
        setError,
        setFieldErrors,
        client,
        characterClient,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          '2',
          { name, role: '', description: '', privateDescription: '', money: '0' },
          { setStatus, setFieldErrors },
        );

        expect(setStatus).toHaveBeenCalledWith('submitting');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
