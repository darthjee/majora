import { renderToStaticMarkup } from 'react-dom/server';
import StaffStatisticsVisitListHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsVisitListHelper.jsx';
import { DEFAULTS }
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsFilters.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffStatisticsVisitListHelper', function() {
  const t = (key) => Translator.t(`staff_statistics_page.visit_list.${key}`);
  const filters = { ...DEFAULTS, range: '7d' };
  const rowFor = (id) => ({
    id, startedAt: '2026-01-07T10:00:00Z', lastSeenAt: '2026-01-07T10:05:00Z', durationSeconds: 300,
    hits: 9, ongoing: false, ip: '10.0.0.1', domain: 'example.com', sessionId: `s${id}`, user: null,
  });
  const dataFor = (overrides = {}) => ({
    rows: [rowFor(5)],
    page: 1,
    pages: 1,
    perPage: 20,
    sort: 'started_at',
    empty: false,
    ...overrides,
  });

  describe('.render', function() {
    const render = (data) => renderToStaticMarkup(StaffStatisticsVisitListHelper.render(data, filters));

    it('renders the section, the title and the table', function() {
      const html = render(dataFor());

      expect(html).toContain('data-testid="statistics-visit-list"');
      expect(html).toContain(t('title'));
      expect(html).toContain('data-testid="statistics-visit-list-table"');
      expect(html).toContain('data-testid="statistics-visit-list-row-5"');
      expect(html).not.toContain('data-testid="statistics-visit-list-empty"');
    });

    it('renders no pagination for a single page', function() {
      expect(render(dataFor())).not.toContain('class="pagination');
    });

    it('renders the pagination with the filters and the sort', function() {
      const html = render(dataFor({ page: 2, pages: 3, sort: 'duration' }));

      expect(html).toContain('class="pagination');
      expect(html).toContain('href="#/staff/statistics/visit-list?page=3&amp;per_page=20&amp;range=7d&amp;sort=duration"');
    });

    it('renders only the empty note when empty on the first page', function() {
      const html = render(dataFor({ rows: [], empty: true }));

      expect(html).toContain('data-testid="statistics-visit-list-empty"');
      expect(html).toContain(t('empty'));
      expect(html).not.toContain('data-testid="statistics-visit-list-table"');
      expect(html).not.toContain('class="pagination');
    });

    it('renders the empty note and the pagination when empty past the first page', function() {
      const html = render(dataFor({
        rows: [], empty: true, page: 4, pages: 3,
      }));

      expect(html).toContain('data-testid="statistics-visit-list-empty"');
      expect(html).not.toContain('data-testid="statistics-visit-list-table"');
      expect(html).toContain('class="pagination');
      expect(html).toContain('href="#/staff/statistics/visit-list?page=3&amp;per_page=20&amp;range=7d"');
    });
  });

  describe('.paginationParams', function() {
    it('drops default filters and the default sort', function() {
      expect(StaffStatisticsVisitListHelper.paginationParams({ ...DEFAULTS }, 'started_at').toString()).toBe('');
    });

    it('keeps non-default filters and a non-default sort', function() {
      expect(StaffStatisticsVisitListHelper.paginationParams(filters, 'last_seen').toString())
        .toBe('range=7d&sort=last_seen');
    });
  });

  describe('.renderState', function() {
    const render = (state) => renderToStaticMarkup(StaffStatisticsVisitListHelper.renderState(state, filters));

    it('renders the loading message while loading', function() {
      const html = render({ data: null, loading: true, error: null });

      expect(html).toContain(Translator.t('staff_statistics_page.charts_loading'));
      expect(html).not.toContain(t('title'));
    });

    it('renders the error alert on failure', function() {
      const html = render({ data: null, loading: false, error: t('load_error') });

      expect(html).toContain('alert-danger');
      expect(html).toContain(t('load_error'));
    });

    it('renders the data once loaded', function() {
      expect(render({ data: dataFor(), loading: false, error: null })).toContain(t('title'));
    });
  });
});
