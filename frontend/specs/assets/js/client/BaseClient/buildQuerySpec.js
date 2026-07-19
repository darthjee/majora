import BaseClient from '../../../../../assets/js/client/BaseClient.js';

describe('BaseClient', function() {
  describe('#buildQuery', function() {
    let client;

    beforeEach(function() {
      client = new BaseClient();
    });

    it('returns an empty URLSearchParams when every entry is undefined', function() {
      expect(client.buildQuery([['page', undefined], ['per_page', undefined]]).toString()).toBe('');
    });

    it('includes only defined entries, in the given order', function() {
      const params = client.buildQuery([['page', 2], ['per_page', undefined], ['name', 'sword']]);
      expect(params.toString()).toBe('page=2&name=sword');
    });

    it('omits null entries', function() {
      expect(client.buildQuery([['max_value', null]]).toString()).toBe('');
    });

    it('omits blank string entries', function() {
      expect(client.buildQuery([['name', '']]).toString()).toBe('');
    });

    it('keeps a numeric zero value', function() {
      expect(client.buildQuery([['max_value', 0]]).toString()).toBe('max_value=0');
    });
  });
});
