import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import {
  buildSetters, buildController, stubEnsure, OPTIONS, TOKENS,
} from './support.js';

describe('ApiTokensController#refresh', function() {
  it('purges apiToken, then re-fetches the list and the options', async function() {
    const setters = buildSetters();
    spyOn(RequestStore, 'purge');
    stubEnsure(RequestStore);

    await buildController(setters).refresh();

    expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'apiToken' });
    expect(RequestStore.purge).toHaveBeenCalledBefore(RequestStore.ensure);
    expect(setters.setLoading).toHaveBeenCalledWith(true);
    expect(setters.setTokens).toHaveBeenCalledWith(TOKENS);
    expect(setters.setOptions).toHaveBeenCalledWith(OPTIONS);
    expect(setters.setLoading.calls.mostRecent().args).toEqual([false]);
  });
});
