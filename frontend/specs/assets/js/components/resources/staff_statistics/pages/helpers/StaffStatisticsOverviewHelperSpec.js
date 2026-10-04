import { renderToStaticMarkup } from 'react-dom/server';
import StaffStatisticsOverviewHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsOverviewHelper.jsx';
import StatisticsBucketFormatter
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsBucketFormatter.js';
import { DEFAULTS }
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsFilters.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffStatisticsOverviewHelper', function() {
  const t = (key) => Translator.t(`staff_statistics_page.overview.${key}`);
  const filters = { ...DEFAULTS, range: '7d', audience: 'anonymous', page: '3' };
  const dataFor = (totals = {}, returningShare = 0.25) => ({
    totals: {
      visits: 1234,
      unique_visitors: 40,
      logged_in_users: 5,
      new_visitors: 30,
      returning_visitors: 10,
      average_duration_seconds: 274,
      ...totals,
    },
    returningShare,
    empty: false,
  });
  const emptyData = {
    totals: {
      visits: 0,
      unique_visitors: 0,
      logged_in_users: 0,
      new_visitors: 0,
      returning_visitors: 0,
      average_duration_seconds: null,
    },
    returningShare: null,
    empty: true,
  };
  const tileKeys = ['visits', 'unique_visitors', 'logged_in_users', 'average_duration', 'new_vs_returning'];
  const valueOf = (html, key) => Object.fromEntries(
    [...html.matchAll(/data-testid="statistics-overview-([a-z_]+)-value">([^<]*)</g)].map((match) => [match[1], match[2]]),
  )[key];

  describe('.render', function() {
    const render = (data) => renderToStaticMarkup(StaffStatisticsOverviewHelper.render(data, filters));

    it('renders the five tiles in order', function() {
      const html = render(dataFor());
      const order = tileKeys.map((key) => html.indexOf(`data-testid="statistics-overview-${key}"`));

      expect(html).toContain('data-testid="statistics-overview"');
      expect(order.every((index) => index >= 0)).toBeTrue();
      expect([...order].sort((a, b) => a - b)).toEqual(order);
      tileKeys.forEach((key) => expect(html).toContain(t(key)));
    });

    it('links each tile to its tab with the filters and without page', function() {
      const html = render(dataFor());
      const hrefs = [...html.matchAll(/class="stretched-link[^"]*" href="([^"]*)"/g)].map((match) => match[1]);

      expect(hrefs).toEqual([
        '#/staff/statistics/visits?range=7d&amp;audience=anonymous',
        '#/staff/statistics/visitors?range=7d&amp;audience=anonymous',
        '#/staff/statistics/users?range=7d&amp;audience=anonymous',
        '#/staff/statistics/duration?range=7d&amp;audience=anonymous',
        '#/staff/statistics/visitors?range=7d&amp;audience=anonymous',
      ]);
    });

    it('formats the counts and the average duration', function() {
      const html = render(dataFor());

      expect(valueOf(html, 'visits')).toBe(StatisticsBucketFormatter.count(1234));
      expect(valueOf(html, 'unique_visitors')).toBe('40');
      expect(valueOf(html, 'logged_in_users')).toBe('5');
      expect(valueOf(html, 'average_duration')).toBe('4m 34s');
      expect(valueOf(html, 'new_vs_returning')).toBe('30 / 10');
    });

    it('renders the new and returning lines, the share and the note', function() {
      const html = render(dataFor());

      expect(html).toContain(t('new_visitors').replace('{{count}}', '30'));
      expect(html).toContain(t('returning_visitors').replace('{{count}}', '10'));
      expect(html).toContain(t('returning_share').replace('{{share}}', StatisticsBucketFormatter.percent(0.25)));
      expect(html).toContain('data-testid="statistics-overview-first-visit-note"');
    });

    it('renders a dash for a null average', function() {
      expect(valueOf(render(dataFor({ average_duration_seconds: null })), 'average_duration')).toBe('—');
    });

    it('renders an empty range with zeros, a dash, no share and the note', function() {
      const html = render(emptyData);

      expect(valueOf(html, 'visits')).toBe('0');
      expect(valueOf(html, 'unique_visitors')).toBe('0');
      expect(valueOf(html, 'logged_in_users')).toBe('0');
      expect(valueOf(html, 'average_duration')).toBe('—');
      expect(valueOf(html, 'new_vs_returning')).toBe('0 / 0');
      expect(html).not.toContain('data-testid="statistics-overview-returning-share"');
      expect(html).toContain('data-testid="statistics-overview-first-visit-note"');
    });
  });

  describe('.renderState', function() {
    const render = (state) => renderToStaticMarkup(StaffStatisticsOverviewHelper.renderState(state, filters));

    it('renders the loading message while loading', function() {
      const html = render({ data: null, loading: true, error: null });

      expect(html).toContain(t('loading'));
      expect(html).not.toContain('data-testid="statistics-overview"');
    });

    it('renders the error alert on failure', function() {
      const html = render({ data: null, loading: false, error: t('load_error') });

      expect(html).toContain('alert-danger');
      expect(html).toContain(t('load_error'));
    });

    it('renders the tiles once loaded', function() {
      expect(render({ data: dataFor(), loading: false, error: null })).toContain('data-testid="statistics-overview"');
    });
  });
});
