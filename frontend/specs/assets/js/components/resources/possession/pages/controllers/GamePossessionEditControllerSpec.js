import GamePossessionEditController
  from '../../../../../../../../assets/js/components/resources/possession/pages/controllers/GamePossessionEditController.js';
import AuthStorage from '../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GamePossessionEditController', function() {
  let setPossession;
  let setLoading;
  let setError;
  let setFieldErrors;
  let client;
  let ensureSpy;

  beforeEach(function() {
    setPossession = jasmine.createSpy('setPossession');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setFieldErrors = jasmine.createSpy('setFieldErrors');
    client = jasmine.createSpyObj('client', ['currentHash', 'fetch', 'patchJson']);
    client.currentHash.and.returnValue('#/games/demo/possessions/5/edit');
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(
      Promise.resolve({ data: { id: 5, name: 'Old Tavern', hidden: false } }),
    );
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('.getParamsFromHash', function() {
    it('extracts the game slug and possession id', function() {
      expect(GamePossessionEditController.getParamsFromHash('#/games/demo/possessions/5/edit')).toEqual({
        game_slug: 'demo', id: '5',
      });
    });

    it('defaults to empty strings for a non-matching hash', function() {
      expect(GamePossessionEditController.getParamsFromHash('#/games/demo')).toEqual({
        game_slug: '', id: '',
      });
    });
  });

  describe('#buildEffect', function() {
    it('fetches the possession through RequestStore and sets the loaded possession', async function() {
      const cleanup = new GamePossessionEditController(setPossession, setLoading, setError, setFieldErrors, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'GamePossessionEditController',
        resource: 'possession',
        quantityType: 'single',
        params: { gameSlug: 'demo', kind: 'game', id: '5' },
      });
      expect(setPossession).toHaveBeenCalledWith({ id: 5, name: 'Old Tavern', hidden: false });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets an error when the fetch rejects', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new GamePossessionEditController(setPossession, setLoading, setError, setFieldErrors, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load possession.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error and skips fetching when route params are missing', function() {
      client.currentHash.and.returnValue('#/games/demo');

      const cleanup = new GamePossessionEditController(setPossession, setLoading, setError, setFieldErrors, client)
        .buildEffect()();

      expect(setError).toHaveBeenCalledWith('Unable to load possession.');
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    });

    it('does not update state after unmount', async function() {
      const cleanup = new GamePossessionEditController(setPossession, setLoading, setError, setFieldErrors, client)
        .buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setPossession).not.toHaveBeenCalled();
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

    it('does nothing while the possession has not loaded yet', function() {
      const controller = new GamePossessionEditController(setPossession, setLoading, setError, setFieldErrors, client);

      controller.applyLoadedItem(null, setters);

      expect(setters.setName).not.toHaveBeenCalled();
    });

    it('seeds the form fields from the loaded possession', function() {
      const controller = new GamePossessionEditController(setPossession, setLoading, setError, setFieldErrors, client);
      const possession = {
        id: 5, name: 'Old Tavern', description: 'Cozy', hidden: true,
      };

      controller.applyLoadedItem(possession, setters);

      expect(setters.setName).toHaveBeenCalledWith('Old Tavern');
      expect(setters.setDescription).toHaveBeenCalledWith('Cozy');
      expect(setters.setHidden).toHaveBeenCalledWith(true);
    });

    it('defaults a missing description to an empty string and hidden to false', function() {
      const controller = new GamePossessionEditController(setPossession, setLoading, setError, setFieldErrors, client);
      const possession = { id: 5, name: 'Old Tavern' };

      controller.applyLoadedItem(possession, setters);

      expect(setters.setDescription).toHaveBeenCalledWith('');
      expect(setters.setHidden).toHaveBeenCalledWith(false);
    });
  });

  describe('#submitForm', function() {
    let setStatus;

    beforeEach(function() {
      setStatus = jasmine.createSpy('setStatus');
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 5, name: 'New Name' }),
      }));
    });

    it('prevents default, resets status/errors, and PATCHes the fields payload', async function() {
      const controller = new GamePossessionEditController(setPossession, setLoading, setError, setFieldErrors, client);
      const event = jasmine.createSpyObj('event', ['preventDefault']);

      await controller.submitForm(
        event, 'demo', '5', { name: 'New Name', description: 'Cozy', hidden: true }, { setStatus, setFieldErrors },
      );

      expect(event.preventDefault).toHaveBeenCalled();
      expect(setStatus).toHaveBeenCalledWith('submitting');
      expect(setFieldErrors).toHaveBeenCalledWith({});
      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'GamePossessionEditController',
        resource: 'possession',
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug: 'demo', id: '5' },
        body: { name: 'New Name', description: 'Cozy', hidden: true },
      });
    });

    it('redirects to the possession detail page on success', async function() {
      const controller = new GamePossessionEditController(setPossession, setLoading, setError, setFieldErrors, client);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined, 'demo', '5', { name: 'New Name', description: '', hidden: false }, { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/games/demo/possessions/5');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets field errors on a 400 response', async function() {
      RequestStore.mutate.and.returnValue(Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ errors: { name: ['is too short'] } }),
      }));

      const controller = new GamePossessionEditController(setPossession, setLoading, setError, setFieldErrors, client);

      await controller.submitForm(
        undefined, 'demo', '5', { name: 'X', description: '', hidden: false }, { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ name: ['is too short'] });
    });

    it('sets status to error on a non-400 failure', async function() {
      RequestStore.mutate.and.returnValue(
        Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) }),
      );

      const controller = new GamePossessionEditController(setPossession, setLoading, setError, setFieldErrors, client);

      await controller.submitForm(
        undefined, 'demo', '5', { name: 'New Name', description: '', hidden: false }, { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the network request throws', async function() {
      RequestStore.mutate.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GamePossessionEditController(setPossession, setLoading, setError, setFieldErrors, client);

      await controller.submitForm(
        undefined, 'demo', '5', { name: 'New Name', description: '', hidden: false }, { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('does not throw when called without an event', async function() {
      const controller = new GamePossessionEditController(setPossession, setLoading, setError, setFieldErrors, client);

      await controller.submitForm(
        undefined, 'demo', '5', { name: 'New Name', description: '', hidden: false }, { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('submitting');
    });
  });
});
