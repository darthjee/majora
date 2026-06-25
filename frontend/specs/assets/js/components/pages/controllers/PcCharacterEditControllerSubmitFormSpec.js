import PcCharacterEditController
  from '../../../../../../assets/js/components/pages/controllers/PcCharacterEditController.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';

describe('PcCharacterEditController#submitForm', function() {
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
    characterClient = jasmine.createSpyObj('characterClient', ['fetchPc', 'updatePc']);
    spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
    characterClient.updatePc.and.returnValue(Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 2, can_edit: true }),
    }));
  });

  it('prevents default, resets status/errors, and submits the built fields payload', async function() {
    const controller = new PcCharacterEditController(
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
      await controller.submitForm(
        event,
        'demo',
        '2',
        {
          name: 'Aragorn',
          avatarUrl: 'http://example.com/a.png',
          characterClass: 'Ranger',
          level: 10,
          description: 'King',
          privateDescription: 'Secret notes',
        },
        { setStatus, setFieldErrors },
      );

      expect(event.preventDefault).toHaveBeenCalled();
      expect(setStatus).toHaveBeenCalledWith('submitting');
      expect(setFieldErrors).toHaveBeenCalledWith({});
      expect(characterClient.updatePc).toHaveBeenCalledWith(
        'demo',
        '2',
        'tok-abc',
        {
          name: 'Aragorn',
          avatar_url: 'http://example.com/a.png',
          character_class: 'Ranger',
          level: 10,
          public_description: 'King',
          private_description: 'Secret notes',
        },
      );
    } finally {
      delete globalThis.window;
    }
  });

  it('does not throw when called without an event', async function() {
    const controller = new PcCharacterEditController(
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
        { name: 'Aragorn', avatarUrl: '', characterClass: '', level: '', description: '', privateDescription: '' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('submitting');
    } finally {
      delete globalThis.window;
    }
  });
});
