import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import {
  buildSetters, buildController, stubEnsure, OPTIONS, TOKENS,
} from './support.js';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('ApiTokensController#buildEffect', function() {
  let setters;

  beforeEach(function() {
    setters = buildSetters();
    globalThis.window = { location: { hash: '#/account/api_tokens' } };
  });

  afterEach(function() {
    delete globalThis.window;
    AuthStorage.clearToken();
  });

  describe('when logged out', function() {
    it('redirects home without fetching', function() {
      spyOn(RequestStore, 'ensure');
      spyOn(RequestStore, 'purge');

      const cleanup = buildController(setters).buildEffect()();

      expect(globalThis.window.location.hash).toBe('/');
      expect(RequestStore.ensure).not.toHaveBeenCalled();
      expect(RequestStore.purge).not.toHaveBeenCalled();
      expect(() => cleanup()).not.toThrow();
    });
  });

  describe('when logged in', function() {
    beforeEach(function() {
      AuthStorage.setToken('session-token');
    });

    it('loads the list and the options from the apiToken resource', async function() {
      stubEnsure(RequestStore);

      const cleanup = buildController(setters).buildEffect()();
      await flush();

      expect(RequestStore.ensure).toHaveBeenCalledWith({
        componentName: 'ApiTokensController', resource: 'apiToken', quantityType: 'collection',
      });
      expect(RequestStore.ensure).toHaveBeenCalledWith({
        componentName: 'ApiTokensController', resource: 'apiToken', quantityType: 'options',
      });
      expect(setters.setTokens).toHaveBeenCalledWith(TOKENS);
      expect(setters.setOptions).toHaveBeenCalledWith(OPTIONS);
      expect(setters.setLoading).toHaveBeenCalledWith(false);
      expect(setters.setError).not.toHaveBeenCalledWith(true);
      cleanup();
    });

    it('purges apiToken before the first fetch, dropping a previous session cache', async function() {
      stubEnsure(RequestStore);
      spyOn(RequestStore, 'purge');

      const cleanup = buildController(setters).buildEffect()();
      await flush();

      expect(RequestStore.purge).toHaveBeenCalledOnceWith({ resource: 'apiToken' });
      expect(RequestStore.purge).toHaveBeenCalledBefore(RequestStore.ensure);
      cleanup();
    });

    it('sets an empty list for an empty response', async function() {
      stubEnsure(RequestStore, { tokens: [] });

      buildController(setters).buildEffect()();
      await flush();

      expect(setters.setTokens).toHaveBeenCalledWith([]);
    });

    it('defaults a non-array list to empty', async function() {
      stubEnsure(RequestStore, { tokens: null });

      buildController(setters).buildEffect()();
      await flush();

      expect(setters.setTokens).toHaveBeenCalledWith([]);
    });

    it('sets the error on a list failure', async function() {
      stubEnsure(RequestStore, { tokens: new Error('boom') });

      buildController(setters).buildEffect()();
      await flush();

      expect(setters.setError).toHaveBeenCalledWith(true);
      expect(setters.setLoading).toHaveBeenCalledWith(false);
      expect(setters.setOptions).toHaveBeenCalledWith(OPTIONS);
    });

    it('sets the options error independently', async function() {
      stubEnsure(RequestStore, { options: new Error('boom') });

      buildController(setters).buildEffect()();
      await flush();

      expect(setters.setOptionsError).toHaveBeenCalledWith(true);
      expect(setters.setOptions).toHaveBeenCalledWith(null);
      expect(setters.setTokens).toHaveBeenCalledWith(TOKENS);
    });

    it('stops setting state once unmounted', async function() {
      stubEnsure(RequestStore);

      const cleanup = buildController(setters).buildEffect()();
      cleanup();
      await flush();

      expect(setters.setTokens).not.toHaveBeenCalled();
    });
  });
});
