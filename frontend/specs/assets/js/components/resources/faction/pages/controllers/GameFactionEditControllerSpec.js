import GameFactionEditController
  from '../../../../../../../../assets/js/components/resources/faction/pages/controllers/GameFactionEditController.js';
import AuthStorage from '../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GameFactionEditController', function() {
  let setFaction;
  let setLoading;
  let setError;
  let setFieldErrors;
  let client;
  let ensureSpy;

  beforeEach(function() {
    setFaction = jasmine.createSpy('setFaction');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setFieldErrors = jasmine.createSpy('setFieldErrors');
    client = jasmine.createSpyObj('client', ['currentHash', 'fetch', 'patchJson']);
    client.currentHash.and.returnValue('#/games/demo/factions/5/edit');
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(
      Promise.resolve({ data: { id: 5, name: 'The Silver Hand' } }),
    );
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('.getParamsFromHash', function() {
    it('extracts the game slug and faction id', function() {
      expect(GameFactionEditController.getParamsFromHash('#/games/demo/factions/5/edit')).toEqual({
        game_slug: 'demo', id: '5',
      });
    });

    it('defaults to empty strings for a non-matching hash', function() {
      expect(GameFactionEditController.getParamsFromHash('#/games/demo')).toEqual({
        game_slug: '', id: '',
      });
    });
  });

  describe('#buildEffect', function() {
    it('fetches the faction through RequestStore and sets the loaded faction', async function() {
      const cleanup = new GameFactionEditController(setFaction, setLoading, setError, setFieldErrors, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'GameFactionEditController',
        resource: 'faction',
        quantityType: 'single',
        params: { gameSlug: 'demo', id: '5' },
      });
      expect(setFaction).toHaveBeenCalledWith({ id: 5, name: 'The Silver Hand' });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets an error when the fetch rejects', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new GameFactionEditController(setFaction, setLoading, setError, setFieldErrors, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load faction.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error and skips fetching when route params are missing', function() {
      client.currentHash.and.returnValue('#/games/demo');

      const cleanup = new GameFactionEditController(setFaction, setLoading, setError, setFieldErrors, client)
        .buildEffect()();

      expect(setError).toHaveBeenCalledWith('Unable to load faction.');
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    });

    it('does not update state after unmount', async function() {
      const cleanup = new GameFactionEditController(setFaction, setLoading, setError, setFieldErrors, client)
        .buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setFaction).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });

  describe('#applyLoadedItem', function() {
    let setters;

    beforeEach(function() {
      setters = { setName: jasmine.createSpy('setName') };
    });

    it('does nothing while the faction has not loaded yet', function() {
      const controller = new GameFactionEditController(setFaction, setLoading, setError, setFieldErrors, client);

      controller.applyLoadedItem(null, setters);

      expect(setters.setName).not.toHaveBeenCalled();
    });

    it('seeds the form fields from the loaded faction', function() {
      const controller = new GameFactionEditController(setFaction, setLoading, setError, setFieldErrors, client);
      const faction = { id: 5, name: 'The Silver Hand' };

      controller.applyLoadedItem(faction, setters);

      expect(setters.setName).toHaveBeenCalledWith('The Silver Hand');
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

    it('prevents default, resets status/errors, and PATCHes the name payload', async function() {
      const controller = new GameFactionEditController(setFaction, setLoading, setError, setFieldErrors, client);
      const event = jasmine.createSpyObj('event', ['preventDefault']);

      await controller.submitForm(
        event, 'demo', '5', { name: 'New Name' }, { setStatus, setFieldErrors },
      );

      expect(event.preventDefault).toHaveBeenCalled();
      expect(setStatus).toHaveBeenCalledWith('submitting');
      expect(setFieldErrors).toHaveBeenCalledWith({});
      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'GameFactionEditController',
        resource: 'faction',
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug: 'demo', id: '5' },
        body: { name: 'New Name' },
      });
    });

    it('redirects to the faction detail page on success', async function() {
      const controller = new GameFactionEditController(setFaction, setLoading, setError, setFieldErrors, client);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined, 'demo', '5', { name: 'New Name' }, { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/games/demo/factions/5');
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

      const controller = new GameFactionEditController(setFaction, setLoading, setError, setFieldErrors, client);

      await controller.submitForm(
        undefined, 'demo', '5', { name: 'X' }, { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ name: ['is too short'] });
    });

    it('sets status to error on a non-400 failure', async function() {
      RequestStore.mutate.and.returnValue(
        Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) }),
      );

      const controller = new GameFactionEditController(setFaction, setLoading, setError, setFieldErrors, client);

      await controller.submitForm(
        undefined, 'demo', '5', { name: 'New Name' }, { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the network request throws', async function() {
      RequestStore.mutate.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameFactionEditController(setFaction, setLoading, setError, setFieldErrors, client);

      await controller.submitForm(
        undefined, 'demo', '5', { name: 'New Name' }, { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('does not throw when called without an event', async function() {
      const controller = new GameFactionEditController(setFaction, setLoading, setError, setFieldErrors, client);

      await controller.submitForm(
        undefined, 'demo', '5', { name: 'New Name' }, { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('submitting');
    });
  });
});
