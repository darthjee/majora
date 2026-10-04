import resourceConfig from '../../../../../assets/js/utils/requests/resourceConfig.js';

describe('resourceConfig staffStatistics (issue #1499)', function() {
  it('resolves GET.domains as a single un-branched variant', function() {
    const domains = resourceConfig.get('GET', 'staffStatistics', 'domains');

    expect(domains.regular).toBe(domains.private);
    expect(domains.regular.path()).toBe('/staff/statistics/domains.json');
    expect(domains.regular.permission).toBeNull();
  });

  it('returns null for an unconfigured quantity type', function() {
    expect(resourceConfig.get('GET', 'staffStatistics', 'collection')).toBeNull();
  });
});
