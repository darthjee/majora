import resourceConfig from '../../../../../assets/js/utils/requests/resourceConfig.js';

describe('resourceConfig apiToken (issue #1605)', function() {
  const CASES = [
    { method: 'GET', type: 'collection', params: {}, path: '/account/api_tokens.json' },
    { method: 'GET', type: 'options', params: {}, path: '/account/api_tokens/options.json' },
    { method: 'POST', type: 'collection', params: {}, path: '/account/api_tokens.json' },
    { method: 'PATCH', type: 'single', params: { id: 7 }, path: '/account/api_tokens/7.json' },
    { method: 'DELETE', type: 'single', params: { id: 7 }, path: '/account/api_tokens/7.json' },
  ];

  CASES.forEach(({ method, type, params, path }) => {
    it(`resolves ${method}.${type} as a single un-branched variant`, function() {
      const entry = resourceConfig.get(method, 'apiToken', type);

      expect(entry.regular).toBe(entry.private);
      expect(entry.regular.path(params)).toBe(path);
      expect(entry.regular.permission).toBeNull();
    });
  });

  it('returns null for an unconfigured quantity type', function() {
    expect(resourceConfig.get('GET', 'apiToken', 'single')).toBeNull();
  });
});
