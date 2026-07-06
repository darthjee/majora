import HashQueryParams from '../../../../assets/js/utils/HashQueryParams.js';

describe('HashQueryParams', function() {
  describe('.parse', function() {
    it('reads query params from hash', function() {
      const params = HashQueryParams.parse('#/games?page=2&per_page=4&foo=bar');
      expect(params.get('page')).toBe('2');
      expect(params.get('per_page')).toBe('4');
      expect(params.get('foo')).toBe('bar');
    });

    it('returns empty params when no query string exists', function() {
      expect(HashQueryParams.parse('#/games').toString()).toBe('');
    });
  });
});
