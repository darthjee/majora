import StaffUserRecoveryTokensController
  from '../../../../../../../../assets/js/components/resources/staff_user/pages/controllers/StaffUserRecoveryTokensController.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('StaffUserRecoveryTokensController', function() {
  let setTokens;
  let setLoading;
  let setError;
  let setActionError;
  let ensureSpy;
  let purgeSpy;

  beforeEach(function() {
    setTokens = jasmine.createSpy('setTokens');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setActionError = jasmine.createSpy('setActionError');
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(
      Promise.resolve({ data: [{ id: 1, status: 'valid' }] }),
    );
    purgeSpy = spyOn(RequestStore, 'purge');
  });

  const buildController = () => new StaffUserRecoveryTokensController(
    setTokens, setLoading, setError, setActionError,
  );

  describe('#buildEffect', function() {
    it('fetches the tokens through RequestStore', async function() {
      const cleanup = buildController().buildEffect('7')();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'StaffUserRecoveryTokensController',
        resource: 'staffUser',
        quantityType: 'recoveryTokens',
        params: { id: '7' },
      });
      expect(setTokens).toHaveBeenCalledWith([{ id: 1, status: 'valid' }]);
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets an empty array when the response data is not an array', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: null }));

      const cleanup = buildController().buildEffect('7')();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setTokens).toHaveBeenCalledWith([]);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets an empty array when the response data is already empty', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: [] }));

      const cleanup = buildController().buildEffect('7')();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setTokens).toHaveBeenCalledWith([]);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error when the fetch rejects', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = buildController().buildEffect('7')();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setTokens).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith(true);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('does not update state after unmount', async function() {
      const cleanup = buildController().buildEffect('7')();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setTokens).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
      expect(setError).not.toHaveBeenCalled();
    });
  });

  describe('#refresh', function() {
    it('clears actionError, purges the staffUser resource and re-fetches the tokens', async function() {
      await buildController().refresh('7');

      expect(setActionError).toHaveBeenCalledWith(false);
      expect(purgeSpy).toHaveBeenCalledWith({ resource: 'staffUser' });
      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'StaffUserRecoveryTokensController',
        resource: 'staffUser',
        quantityType: 'recoveryTokens',
        params: { id: '7' },
      });
      expect(setTokens).toHaveBeenCalledWith([{ id: 1, status: 'valid' }]);
    });
  });

  describe('mutation actions', function() {
    let mutateSpy;

    beforeEach(function() {
      mutateSpy = spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({ ok: true }));
    });

    describe('#handleUnexpire', function() {
      it('mutates through RequestStore and refreshes on success', async function() {
        await buildController().handleUnexpire('7', 3);

        expect(mutateSpy).toHaveBeenCalledWith({
          componentName: 'StaffUserRecoveryTokensController',
          resource: 'staffUser',
          method: 'POST',
          quantityType: 'unexpireRecoveryToken',
          params: { id: '7', tokenId: 3 },
        });
        expect(purgeSpy).toHaveBeenCalledWith({ resource: 'staffUser' });
        expect(setTokens).toHaveBeenCalledWith([{ id: 1, status: 'valid' }]);
        expect(setActionError).toHaveBeenCalledWith(false);
        expect(setActionError).not.toHaveBeenCalledWith(true);
      });

      it('sets actionError and still refreshes on a non-ok response', async function() {
        mutateSpy.and.returnValue(Promise.resolve({ ok: false, status: 404 }));

        await buildController().handleUnexpire('7', 3);

        expect(setActionError).toHaveBeenCalledWith(true);
        expect(purgeSpy).toHaveBeenCalledWith({ resource: 'staffUser' });
        expect(setTokens).toHaveBeenCalledWith([{ id: 1, status: 'valid' }]);
      });

      it('sets actionError and still refreshes when the mutation throws', async function() {
        mutateSpy.and.returnValue(Promise.reject(new Error('network error')));

        await buildController().handleUnexpire('7', 3);

        expect(setActionError).toHaveBeenCalledWith(true);
        expect(purgeSpy).toHaveBeenCalledWith({ resource: 'staffUser' });
        expect(setTokens).toHaveBeenCalledWith([{ id: 1, status: 'valid' }]);
      });
    });

    describe('#handleForceExpire', function() {
      it('mutates through RequestStore and refreshes on success', async function() {
        await buildController().handleForceExpire('7', 3);

        expect(mutateSpy).toHaveBeenCalledWith({
          componentName: 'StaffUserRecoveryTokensController',
          resource: 'staffUser',
          method: 'POST',
          quantityType: 'forceExpireRecoveryToken',
          params: { id: '7', tokenId: 3 },
        });
        expect(setTokens).toHaveBeenCalledWith([{ id: 1, status: 'valid' }]);
      });
    });

    describe('#handleDelete', function() {
      it('mutates through RequestStore with DELETE and refreshes on success', async function() {
        await buildController().handleDelete('7', 3);

        expect(mutateSpy).toHaveBeenCalledWith({
          componentName: 'StaffUserRecoveryTokensController',
          resource: 'staffUser',
          method: 'DELETE',
          quantityType: 'deleteRecoveryToken',
          params: { id: '7', tokenId: 3 },
        });
        expect(setTokens).toHaveBeenCalledWith([{ id: 1, status: 'valid' }]);
      });
    });
  });
});
