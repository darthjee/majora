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

  afterEach(function() {
    AuthStorage.clearToken();
  });

  beforeEach(function() {
    setCharacter = jasmine.createSpy('setCharacter');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setFieldErrors = jasmine.createSpy('setFieldErrors');
    setStatus = jasmine.createSpy('setStatus');
    client = jasmine.createSpyObj('client', ['currentHash', 'request']);
    spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
    client.request.and.returnValue(Promise.resolve({
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
        },
        { setStatus, setFieldErrors },
      );

      expect(event.preventDefault).toHaveBeenCalled();
      expect(setStatus).toHaveBeenCalledWith('submitting');
      expect(setFieldErrors).toHaveBeenCalledWith({});
      expect(client.request).toHaveBeenCalledWith('/games/demo/pcs/2.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Token tok-abc',
        },
        body: JSON.stringify({
          name: 'Aragorn',
          avatar_url: 'http://example.com/a.png',
          character_class: 'Ranger',
          level: 10,
          description: 'King',
        }),
      });
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
    );
    const fakeWindow = { location: { hash: '' } };
    globalThis.window = fakeWindow;

    try {
      await controller.submitForm(
        undefined,
        'demo',
        '2',
        { name: 'Aragorn', avatarUrl: '', characterClass: '', level: '', description: '' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('submitting');
    } finally {
      delete globalThis.window;
    }
  });
});
