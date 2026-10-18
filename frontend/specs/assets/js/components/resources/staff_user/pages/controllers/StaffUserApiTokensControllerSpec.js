import StaffUserApiTokensController
  from '../../../../../../../../assets/js/components/resources/staff_user/pages/controllers/StaffUserApiTokensController.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('StaffUserApiTokensController', function() {
  let setTokens;
  let setLoading;
  let setError;
  let setNotice;
  let ensureSpy;
  let purgeSpy;

  const tokens = [{ id: 1, name: 'CI bot', prefix: 'abcd1234' }];
  const ensureArgs = {
    componentName: 'StaffUserApiTokensController',
    resource: 'staffUser',
    quantityType: 'apiTokens',
    params: { id: '7' },
  };

  beforeEach(function() {
    setTokens = jasmine.createSpy('setTokens');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setNotice = jasmine.createSpy('setNotice');
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: tokens }));
    purgeSpy = spyOn(RequestStore, 'purge');
  });

  const buildController = () => new StaffUserApiTokensController(
    setTokens, setLoading, setError, setNotice,
  );

  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  describe('#buildEffect', function() {
    it('fetches the tokens through RequestStore', async function() {
      const cleanup = buildController().buildEffect('7')();
      await flush();

      expect(ensureSpy).toHaveBeenCalledWith(ensureArgs);
      expect(setTokens).toHaveBeenCalledWith(tokens);
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets an empty array when the response data is not an array', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: null }));

      const cleanup = buildController().buildEffect('7')();
      await flush();

      expect(setTokens).toHaveBeenCalledWith([]);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets an error when the fetch rejects', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = buildController().buildEffect('7')();
      await flush();

      expect(setTokens).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith(true);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('does not update state after unmount', async function() {
      const cleanup = buildController().buildEffect('7')();
      cleanup();
      await flush();

      expect(setTokens).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
      expect(setError).not.toHaveBeenCalled();
    });
  });

  describe('#refresh', function() {
    it('purges the staffUser resource and re-fetches the tokens without touching the notice', async function() {
      await buildController().refresh('7');

      expect(purgeSpy).toHaveBeenCalledWith({ resource: 'staffUser' });
      expect(ensureSpy).toHaveBeenCalledWith(ensureArgs);
      expect(setTokens).toHaveBeenCalledWith(tokens);
      expect(setNotice).not.toHaveBeenCalled();
    });
  });

  describe('#revoke', function() {
    let mutateSpy;

    beforeEach(function() {
      mutateSpy = spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({ ok: true, status: 204 }));
    });

    it('deletes through RequestStore, then purges and re-fetches', async function() {
      await buildController().revoke('7', 3);

      expect(mutateSpy).toHaveBeenCalledWith({
        componentName: 'StaffUserApiTokensController',
        resource: 'staffUser',
        method: 'DELETE',
        quantityType: 'deleteApiToken',
        params: { id: '7', tokenId: 3 },
      });
      expect(purgeSpy).toHaveBeenCalledWith({ resource: 'staffUser' });
      expect(ensureSpy).toHaveBeenCalledWith(ensureArgs);
      expect(setTokens).toHaveBeenCalledWith(tokens);
      expect(setNotice.calls.allArgs()).toEqual([[null]]);
    });

    it('sets the token_gone notice and refreshes on a 404', async function() {
      mutateSpy.and.returnValue(Promise.resolve({ ok: false, status: 404 }));

      await buildController().revoke('7', 3);

      expect(setNotice.calls.allArgs()).toEqual([[null], ['token_gone']]);
      expect(purgeSpy).toHaveBeenCalledWith({ resource: 'staffUser' });
      expect(setTokens).toHaveBeenCalledWith(tokens);
    });

    it('sets the action_error notice and refreshes on another non-ok response', async function() {
      mutateSpy.and.returnValue(Promise.resolve({ ok: false, status: 500 }));

      await buildController().revoke('7', 3);

      expect(setNotice.calls.allArgs()).toEqual([[null], ['action_error']]);
      expect(purgeSpy).toHaveBeenCalledWith({ resource: 'staffUser' });
      expect(setTokens).toHaveBeenCalledWith(tokens);
    });

    it('sets the action_error notice and refreshes when the mutation throws', async function() {
      mutateSpy.and.returnValue(Promise.reject(new Error('network error')));

      await buildController().revoke('7', 3);

      expect(setNotice.calls.allArgs()).toEqual([[null], ['action_error']]);
      expect(purgeSpy).toHaveBeenCalledWith({ resource: 'staffUser' });
      expect(setTokens).toHaveBeenCalledWith(tokens);
    });
  });
});
