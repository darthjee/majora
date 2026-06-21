import AuthStorage from '../../../../assets/js/utils/AuthStorage.js';

describe('AuthStorage', function() {
  describe('when localStorage is unavailable', function() {
    it('.getToken returns null without throwing', function() {
      expect(AuthStorage.getToken()).toBeNull();
    });

    it('.setToken does not throw', function() {
      expect(() => AuthStorage.setToken('tok-123')).not.toThrow();
    });

    it('.clearToken does not throw', function() {
      expect(() => AuthStorage.clearToken()).not.toThrow();
    });
  });
});
