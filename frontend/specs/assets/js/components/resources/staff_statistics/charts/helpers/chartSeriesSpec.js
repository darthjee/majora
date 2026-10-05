import {
  AUDIENCE_SERIES, NEW_RETURNING_SERIES, chartSeries,
} from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/helpers/chartSeries.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('chartSeries', function() {
  const prefix = 'staff_statistics_page.visits';

  describe('with the audience series', function() {
    it('returns both series in stack order whatever the key order', function() {
      expect(chartSeries(AUDIENCE_SERIES, ['logged_in', 'anonymous'], prefix)).toEqual([
        { key: 'anonymous', color: 'var(--majora-chart-1)', label: Translator.t(`${prefix}.anonymous`) },
        { key: 'logged_in', color: 'var(--majora-chart-2)', label: Translator.t(`${prefix}.logged_in`) },
      ]);
    });

    it('returns only the visible series', function() {
      expect(chartSeries(AUDIENCE_SERIES, ['logged_in'], prefix).map(({ key }) => key))
        .toEqual(['logged_in']);
    });

    it('returns nothing without keys', function() {
      expect(chartSeries(AUDIENCE_SERIES, [], prefix)).toEqual([]);
    });
  });

  describe('with the new vs returning series', function() {
    const visitorsPrefix = 'staff_statistics_page.visitors';

    it('translates the explicit label keys', function() {
      expect(chartSeries(NEW_RETURNING_SERIES, ['returning_visitors', 'new_visitors'], visitorsPrefix))
        .toEqual([
          { key: 'new_visitors', color: 'var(--majora-chart-3)', label: Translator.t(`${visitorsPrefix}.new`) },
          {
            key: 'returning_visitors',
            color: 'var(--majora-chart-4)',
            label: Translator.t(`${visitorsPrefix}.returning`),
          },
        ]);
    });
  });

  it('uses the given label prefix', function() {
    spyOn(Translator, 't').and.callFake((key) => `t:${key}`);

    expect(chartSeries([{ key: 'a', color: 'c', labelKey: 'b' }], ['a'], 'x.y'))
      .toEqual([{ key: 'a', color: 'c', label: 't:x.y.b' }]);
  });
});
