import AuthStorage from '../../../../assets/js/utils/AuthStorage.js';

describe('AuthStorage', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('.getToken', function() {
    it('returns null initially', function() {
      expect(AuthStorage.getToken()).toBeNull();
    });

    it('returns the token after setToken is called', function() {
      AuthStorage.setToken('tok-123');

      expect(AuthStorage.getToken()).toBe('tok-123');
    });
  });

  describe('.setToken', function() {
    it('stores the token so getToken can retrieve it', function() {
      AuthStorage.setToken('tok-abc');

      expect(AuthStorage.getToken()).toBe('tok-abc');
    });
  });

  describe('.clearToken', function() {
    it('resets getToken to null after a token has been set', function() {
      AuthStorage.setToken('tok-123');
      AuthStorage.clearToken();

      expect(AuthStorage.getToken()).toBeNull();
    });
  });
});
