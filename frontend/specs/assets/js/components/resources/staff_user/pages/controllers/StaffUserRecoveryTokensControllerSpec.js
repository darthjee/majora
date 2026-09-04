import StaffUserRecoveryTokensController
  from '../../../../../../../../assets/js/components/resources/staff_user/pages/controllers/StaffUserRecoveryTokensController.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('StaffUserRecoveryTokensController', function() {
  let setTokens;
  let setLoading;
  let setError;
  let ensureSpy;

  beforeEach(function() {
    setTokens = jasmine.createSpy('setTokens');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(
      Promise.resolve({ data: [{ id: 1, status: 'valid' }] }),
    );
  });

  const buildController = () => new StaffUserRecoveryTokensController(setTokens, setLoading, setError);

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
});
