import StatisticsTabs, { STATISTICS_TABS }
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsTabs.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StatisticsTabs', function() {
  it('lists the seven tabs in order', function() {
    expect(STATISTICS_TABS.map((tab) => [tab.key, tab.path])).toEqual([
      ['overview', '/staff/statistics'],
      ['visits', '/staff/statistics/visits'],
      ['visitors', '/staff/statistics/visitors'],
      ['duration', '/staff/statistics/duration'],
      ['domains', '/staff/statistics/domains'],
      ['users', '/staff/statistics/users'],
      ['visit_list', '/staff/statistics/visit-list'],
    ]);
  });

  it('has a translated label for every tab', function() {
    STATISTICS_TABS.forEach((tab) => {
      expect(StatisticsTabs.label(tab)).toBe(Translator.t(`staff_statistics_page.tabs.${tab.key}`));
      expect(StatisticsTabs.label(tab)).not.toBe(tab.labelKey);
    });
  });

  describe('.find', function() {
    it('finds a tab by key', function() {
      expect(StatisticsTabs.find('visit_list').path).toBe('/staff/statistics/visit-list');
    });

    it('falls back to the overview tab', function() {
      expect(StatisticsTabs.find('nope').key).toBe('overview');
    });
  });

  describe('.hashPath', function() {
    it('prefixes the path with #', function() {
      expect(StatisticsTabs.hashPath('users')).toBe('#/staff/statistics/users');
    });
  });
});
