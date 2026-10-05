import {
  AUDIENCE_SERIES, DURATION_SERIES, HITS_SERIES, NEW_RETURNING_SERIES, chartSeries,
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

  describe('with the duration and hits series (issue #1514)', function() {
    const durationPrefix = 'staff_statistics_page.duration';

    it('translates the duration series by their explicit label keys', function() {
      expect(chartSeries(DURATION_SERIES, ['median_duration_seconds', 'average_duration_seconds'], durationPrefix))
        .toEqual([
          {
            key: 'average_duration_seconds',
            color: 'var(--majora-chart-1)',
            label: Translator.t(`${durationPrefix}.average_duration`),
          },
          {
            key: 'median_duration_seconds',
            color: 'var(--majora-chart-2)',
            label: Translator.t(`${durationPrefix}.median_duration`),
          },
        ]);
    });

    it('translates the hits series by their keys', function() {
      expect(chartSeries(HITS_SERIES, ['average_hits', 'median_hits'], durationPrefix)).toEqual([
        { key: 'average_hits', color: 'var(--majora-chart-1)', label: Translator.t(`${durationPrefix}.average_hits`) },
        { key: 'median_hits', color: 'var(--majora-chart-2)', label: Translator.t(`${durationPrefix}.median_hits`) },
      ]);
    });
  });
});
