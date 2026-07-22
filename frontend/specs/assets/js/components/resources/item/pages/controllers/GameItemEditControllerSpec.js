import GameItemEditController
  from '../../../../../../../../assets/js/components/resources/item/pages/controllers/GameItemEditController.js';
import AuthStorage from '../../../../../../../../assets/js/utils/auth/AuthStorage.js';

describe('GameItemEditController', function() {
  let setItem;
  let setLoading;
  let setError;
  let setFieldErrors;
  let client;

  beforeEach(function() {
    setItem = jasmine.createSpy('setItem');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setFieldErrors = jasmine.createSpy('setFieldErrors');
    client = jasmine.createSpyObj('client', ['currentHash', 'fetch', 'patchJson']);
    client.currentHash.and.returnValue('#/games/demo/items/5/edit');
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('.getParamsFromHash', function() {
    it('extracts the game slug and item id', function() {
      expect(GameItemEditController.getParamsFromHash('#/games/demo/items/5/edit')).toEqual({
        game_slug: 'demo', id: '5',
      });
    });

    it('defaults to empty strings for a non-matching hash', function() {
      expect(GameItemEditController.getParamsFromHash('#/games/demo')).toEqual({
        game_slug: '', id: '',
      });
    });
  });

  describe('#buildEffect', function() {
    it('fetches the elevated endpoint and sets the loaded item', async function() {
      client.fetch.and.returnValue(Promise.resolve({ id: 5, name: 'Cloak of Elvenkind', hidden: false }));

      const cleanup = new GameItemEditController(setItem, setLoading, setError, setFieldErrors, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.fetch).toHaveBeenCalledWith('/games/demo/items/5/full.json');
      expect(setItem).toHaveBeenCalledWith({ id: 5, name: 'Cloak of Elvenkind', hidden: false });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets an error when the fetch rejects', async function() {
      client.fetch.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new GameItemEditController(setItem, setLoading, setError, setFieldErrors, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load item.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error and skips fetching when route params are missing', function() {
      client.currentHash.and.returnValue('#/games/demo');

      const cleanup = new GameItemEditController(setItem, setLoading, setError, setFieldErrors, client)
        .buildEffect()();

      expect(setError).toHaveBeenCalledWith('Unable to load item.');
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(client.fetch).not.toHaveBeenCalled();

      cleanup();
    });

    it('does not update state after unmount', async function() {
      client.fetch.and.returnValue(Promise.resolve({ id: 5, name: 'Cloak of Elvenkind' }));

      const cleanup = new GameItemEditController(setItem, setLoading, setError, setFieldErrors, client)
        .buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setItem).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });

  describe('#applyLoadedItem', function() {
    let setters;

    beforeEach(function() {
      setters = {
        setName: jasmine.createSpy('setName'),
        setDescription: jasmine.createSpy('setDescription'),
        setHidden: jasmine.createSpy('setHidden'),
      };
    });

    it('does nothing while the item has not loaded yet', function() {
      const controller = new GameItemEditController(setItem, setLoading, setError, setFieldErrors, client);

      controller.applyLoadedItem(null, setters);

      expect(setters.setName).not.toHaveBeenCalled();
    });

    it('seeds the form fields from the loaded item', function() {
      const controller = new GameItemEditController(setItem, setLoading, setError, setFieldErrors, client);
      const item = { id: 5, name: 'Cloak of Elvenkind', description: 'Shiny', hidden: true };

      controller.applyLoadedItem(item, setters);

      expect(setters.setName).toHaveBeenCalledWith('Cloak of Elvenkind');
      expect(setters.setDescription).toHaveBeenCalledWith('Shiny');
      expect(setters.setHidden).toHaveBeenCalledWith(true);
    });

    it('defaults a missing description to an empty string and hidden to false', function() {
      const controller = new GameItemEditController(setItem, setLoading, setError, setFieldErrors, client);
      const item = { id: 5, name: 'Cloak of Elvenkind' };

      controller.applyLoadedItem(item, setters);

      expect(setters.setDescription).toHaveBeenCalledWith('');
      expect(setters.setHidden).toHaveBeenCalledWith(false);
    });
  });

  describe('#submitForm', function() {
    let setStatus;

    beforeEach(function() {
      setStatus = jasmine.createSpy('setStatus');
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      client.patchJson.and.returnValue(Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 5, name: 'New Name' }),
      }));
    });

    it('prevents default, resets status/errors, and PATCHes the fields payload', async function() {
      const controller = new GameItemEditController(setItem, setLoading, setError, setFieldErrors, client);
      const event = jasmine.createSpyObj('event', ['preventDefault']);

      await controller.submitForm(
        event, 'demo', '5', { name: 'New Name', description: 'Shiny', hidden: true }, { setStatus, setFieldErrors },
      );

      expect(event.preventDefault).toHaveBeenCalled();
      expect(setStatus).toHaveBeenCalledWith('submitting');
      expect(setFieldErrors).toHaveBeenCalledWith({});
      expect(client.patchJson).toHaveBeenCalledWith(
        '/games/demo/items/5.json',
        'tok-abc',
        { name: 'New Name', description: 'Shiny', hidden: true },
      );
    });

    it('redirects to the item detail page on success', async function() {
      const controller = new GameItemEditController(setItem, setLoading, setError, setFieldErrors, client);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined, 'demo', '5', { name: 'New Name', description: '', hidden: false }, { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/games/demo/items/5');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets field errors on a 400 response', async function() {
      client.patchJson.and.returnValue(Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ errors: { name: ['is too short'] } }),
      }));

      const controller = new GameItemEditController(setItem, setLoading, setError, setFieldErrors, client);

      await controller.submitForm(
        undefined, 'demo', '5', { name: 'X', description: '', hidden: false }, { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ name: ['is too short'] });
    });

    it('sets status to error on a non-400 failure', async function() {
      client.patchJson.and.returnValue(Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) }));

      const controller = new GameItemEditController(setItem, setLoading, setError, setFieldErrors, client);

      await controller.submitForm(
        undefined, 'demo', '5', { name: 'New Name', description: '', hidden: false }, { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the network request throws', async function() {
      client.patchJson.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameItemEditController(setItem, setLoading, setError, setFieldErrors, client);

      await controller.submitForm(
        undefined, 'demo', '5', { name: 'New Name', description: '', hidden: false }, { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('does not throw when called without an event', async function() {
      const controller = new GameItemEditController(setItem, setLoading, setError, setFieldErrors, client);

      await controller.submitForm(
        undefined, 'demo', '5', { name: 'New Name', description: '', hidden: false }, { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('submitting');
    });
  });
});
