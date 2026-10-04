import resourceConfig from '../../../../../assets/js/utils/requests/resourceConfig.js';

describe('resourceConfig staffStatistics (issue #1499)', function() {
  it('resolves GET.domains as a single un-branched variant', function() {
    const domains = resourceConfig.get('GET', 'staffStatistics', 'domains');

    expect(domains.regular).toBe(domains.private);
    expect(domains.regular.path()).toBe('/staff/statistics/domains.json');
    expect(domains.regular.permission).toBeNull();
  });

  it('resolves GET.visits as a single un-branched variant (issue #1507)', function() {
    const visits = resourceConfig.get('GET', 'staffStatistics', 'visits');

    expect(visits.regular).toBe(visits.private);
    expect(visits.regular.path()).toBe('/staff/statistics/visits.json');
    expect(visits.regular.permission).toBeNull();
  });

  it('resolves GET.overview as a single un-branched variant (issue #1504)', function() {
    const overview = resourceConfig.get('GET', 'staffStatistics', 'overview');

    expect(overview.regular).toBe(overview.private);
    expect(overview.regular.path()).toBe('/staff/statistics/overview.json');
    expect(overview.regular.permission).toBeNull();
  });

  it('resolves GET.visitors as a single un-branched variant (issue #1510)', function() {
    const visitors = resourceConfig.get('GET', 'staffStatistics', 'visitors');

    expect(visitors.regular).toBe(visitors.private);
    expect(visitors.regular.path()).toBe('/staff/statistics/visitors.json');
    expect(visitors.regular.permission).toBeNull();
  });

  it('returns null for an unconfigured quantity type', function() {
    expect(resourceConfig.get('GET', 'staffStatistics', 'collection')).toBeNull();
  });
});
