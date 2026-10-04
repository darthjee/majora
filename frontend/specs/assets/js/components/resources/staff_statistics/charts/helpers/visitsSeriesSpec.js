import visitsSeries
  from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/helpers/visitsSeries.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('visitsSeries', function() {
  it('returns both series in stack order', function() {
    expect(visitsSeries(['logged_in', 'anonymous'])).toEqual([
      { key: 'anonymous', color: 'var(--majora-chart-1)', label: Translator.t('staff_statistics_page.visits.anonymous') },
      { key: 'logged_in', color: 'var(--majora-chart-2)', label: Translator.t('staff_statistics_page.visits.logged_in') },
    ]);
  });

  it('returns only the visible series', function() {
    expect(visitsSeries(['logged_in']).map(({ key }) => key)).toEqual(['logged_in']);
  });

  it('returns nothing without keys', function() {
    expect(visitsSeries([])).toEqual([]);
  });
});
