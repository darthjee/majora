import BaseClient from '../../../../../assets/js/client/BaseClient.js';

describe('BaseClient', function() {
  describe('#buildRoleQuery', function() {
    let client;

    beforeEach(function() {
      client = new BaseClient();
    });

    it('returns an empty string when no roles are given', function() {
      expect(client.buildRoleQuery()).toBe('');
      expect(client.buildRoleQuery([])).toBe('');
    });

    it('serializes a single role as a role= query param', function() {
      expect(client.buildRoleQuery(['dm'])).toBe('?role=dm');
    });

    it('serializes several roles as repeated role= query params', function() {
      expect(client.buildRoleQuery(['dm', 'player'])).toBe('?role=dm&role=player');
    });
  });
});
