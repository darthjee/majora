import resourceConfig from '../../../../../assets/js/utils/requests/resourceConfig.js';

describe('resourceConfig staffCopy (issue #1571)', function() {
  const CASES = [
    { method: 'GET', type: 'index', params: {}, path: '/staff/copies.json' },
    { method: 'GET', type: 'games', params: {}, path: '/staff/copies/games.json' },
    { method: 'GET', type: 'collection', params: { copyType: 'items' }, path: '/staff/copies/items.json' },
    { method: 'GET', type: 'links', params: {}, path: '/staff/copies/links.json' },
    { method: 'POST', type: 'copy', params: { copyType: 'items', id: 12 }, path: '/staff/copies/items/12.json' },
    { method: 'POST', type: 'renew', params: { uploadId: 5 }, path: '/staff/copies/links/5/renew.json' },
  ];

  CASES.forEach(({ method, type, params, path }) => {
    it(`resolves ${method}.${type} as a single un-branched variant`, function() {
      const entry = resourceConfig.get(method, 'staffCopy', type);

      expect(entry.regular).toBe(entry.private);
      expect(entry.regular.path(params)).toBe(path);
      expect(entry.regular.permission).toBeNull();
    });
  });

  it('returns null for an unconfigured quantity type', function() {
    expect(resourceConfig.get('GET', 'staffCopy', 'single')).toBeNull();
  });
});
