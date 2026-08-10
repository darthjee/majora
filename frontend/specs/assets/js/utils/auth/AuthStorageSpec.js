import AuthStorage from '../../../../../assets/js/utils/auth/AuthStorage.js';

describe('AuthStorage', function() {
  afterEach(function() {
    AuthStorage.clearToken();
    AuthStorage.clearCacheToken();
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

  describe('.getCacheToken', function() {
    it('returns null initially', function() {
      expect(AuthStorage.getCacheToken()).toBeNull();
    });

    it('returns the cache token after setCacheToken is called', function() {
      AuthStorage.setCacheToken('cache-tok-123');

      expect(AuthStorage.getCacheToken()).toBe('cache-tok-123');
    });
  });

  describe('.setCacheToken', function() {
    it('stores the cache token so getCacheToken can retrieve it', function() {
      AuthStorage.setCacheToken('cache-tok-abc');

      expect(AuthStorage.getCacheToken()).toBe('cache-tok-abc');
    });
  });

  describe('.clearCacheToken', function() {
    it('resets getCacheToken to null after a cache token has been set', function() {
      AuthStorage.setCacheToken('cache-tok-123');
      AuthStorage.clearCacheToken();

      expect(AuthStorage.getCacheToken()).toBeNull();
    });
  });
});
