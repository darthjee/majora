import { renderToStaticMarkup } from 'react-dom/server';
import StatisticsVisitListTableHelper, { CREATION_REASONS, VISIT_LIST_COLUMNS }
  from '../../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/helpers/StatisticsVisitListTableHelper.jsx';
import StatisticsDateTimeFormatter
  from '../../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsDateTimeFormatter.js';
import Translator from '../../../../../../../../../assets/js/i18n/Translator.js';

describe('StatisticsVisitListTableHelper', function() {
  const t = (key) => Translator.t(`staff_statistics_page.visit_list.${key}`);
  const filters = { range: '7d', granularity: 'auto', audience: 'all' };
  const loggedRow = {
    id: 7,
    startedAt: '2026-01-07T10:00:00Z',
    lastSeenAt: '2026-01-07T10:05:00Z',
    durationSeconds: 274,
    hits: 1234,
    ongoing: false,
    ip: '10.0.0.1',
    domain: 'example.com',
    sessionId: 'abc123',
    user: {
      id: 5, name: 'Ana', displayName: 'Ana S.', email: 'ana@example.com',
    },
    firstPath: '/#/games',
    lastPath: '/#/games/:id/characters',
    sessionFirstPath: 'unresolved',
    sessionCreationReason: 'login_rotation',
    sessionFirstSeenLogged: true,
  };
  const anonymousRow = {
    ...loggedRow, id: 8, user: null, ongoing: true, domain: t('unknown_domain'), ip: null,
  };

  const element = (state) => StatisticsVisitListTableHelper.render({
    rows: [loggedRow], sort: 'started_at', filters, ...state,
  });
  const render = (state) => renderToStaticMarkup(element(state));
  const findAll = (node, predicate, found = []) => {
    if (!node || typeof node !== 'object') return found;
    if (Array.isArray(node)) {
      node.forEach((child) => findAll(child, predicate, found));
      return found;
    }
    if (predicate(node)) found.push(node);
    findAll(node.props?.children, predicate, found);
    return found;
  };

  it('renders the table test id and every header', function() {
    const html = render();

    expect(html).toContain('data-testid="statistics-visit-list-table"');
    expect(html).toContain('table-hover');
    expect(html).toContain('table-responsive');
    expect(html).toContain(t('user'));
    VISIT_LIST_COLUMNS.forEach(({ labelKey }) => expect(html).toContain(t(labelKey)));
  });

  it('links the user name to the Overview tab filtered by that user', function() {
    const html = render();

    expect(html).toContain('href="#/staff/statistics?range=7d&amp;user=5"');
    expect(html).toContain('Ana');
    expect(html).toContain('Ana S.');
    expect(html).toContain('ana@example.com');
  });

  it('renders the profile link', function() {
    const html = render();

    expect(html).toContain('href="#/staff/users/5"');
    expect(html).toContain('data-testid="statistics-visit-list-profile-7"');
    expect(html).toContain(t('profile'));
  });

  it('omits the display name when not set', function() {
    const html = render({ rows: [{ ...loggedRow, user: { ...loggedRow.user, displayName: null } }] });

    expect(html).not.toContain('Ana S.');
    expect(html).toContain('ana@example.com');
  });

  it('renders an anonymous visit with its session id', function() {
    const html = render({ rows: [anonymousRow] });

    expect(html).toContain(`<td>${t('anonymous')} · #abc123</td>`);
    expect(html).not.toContain('href="#/staff/users/');
  });

  it('renders the unknown domain label and a dash for a missing value', function() {
    const html = render({ rows: [anonymousRow] });

    expect(html).toContain(`<td>${t('unknown_domain')}</td>`);
    expect(html).toContain('<td>—</td>');
  });

  it('formats the columns', function() {
    const html = render();

    expect(html).toContain('<td>10.0.0.1</td>');
    expect(html).toContain('<td>example.com</td>');
    expect(html).toContain(`<td>${StatisticsDateTimeFormatter.format('2026-01-07T10:00:00Z')}</td>`);
    expect(html).toContain(`<td>${StatisticsDateTimeFormatter.format('2026-01-07T10:05:00Z')}</td>`);
    expect(html).toContain('<td>4m 34s</td>');
  });

  it('renders the ongoing badge only for ongoing visits', function() {
    expect(render()).not.toContain(t('ongoing'));

    const html = render({ rows: [anonymousRow] });

    expect(html).toContain('badge bg-success');
    expect(html).toContain(t('ongoing'));
  });

  it('renders rows without link role, tab index or click handler', function() {
    const [row] = findAll(element(), (node) => node.type === 'tr' && node.key === '7');

    expect(row.props.role).toBeUndefined();
    expect(row.props.tabIndex).toBeUndefined();
    expect(row.props.onClick).toBeUndefined();
    expect(row.props['data-testid']).toBe('statistics-visit-list-row-7');
  });

  it('renders no rows for an empty list', function() {
    expect(render({ rows: [] })).not.toContain('statistics-visit-list-row-');
  });

  it('links every sortable header to its sort, keeping the filters', function() {
    const html = render();

    expect(html).toContain('href="#/staff/statistics/visit-list?range=7d"');
    ['last_seen', 'duration', 'hits'].forEach((key) => {
      expect(html).toContain(`href="#/staff/statistics/visit-list?range=7d&amp;sort=${key}"`);
    });
  });

  it('does not link the user, ip, domain, paths and session headers', function() {
    const headers = findAll(element(), (node) => node.type === 'th');
    const plain = headers.filter((header) => findAll(header.props.children, (node) => node.type === 'a').length === 0);

    expect(plain.map((header) => header.props.children)).toEqual([
      t('user'), t('ip'), t('domain'), t('paths'), t('session'),
    ]);
  });

  it('renders the paths and session headers after hits', function() {
    const html = render();

    expect(html.indexOf(`>${t('paths')}</th>`)).toBeGreaterThan(html.indexOf(t('hits')));
    expect(html.indexOf(`>${t('session')}</th>`)).toBeGreaterThan(html.indexOf(`>${t('paths')}</th>`));
  });

  describe('session tracking cells', function() {
    const cell = (row, kind) => {
      const html = render({ rows: [row] });
      const start = html.indexOf(`data-testid="statistics-visit-list-${kind}-${row.id}"`);

      return html.slice(start, html.indexOf('</td>', start));
    };
    const detail = (label, value) => `<span class="text-muted">${label}: </span>${value}</div>`;
    const unknown = `<span>${t('unknown')}</span>`;

    it('renders the first and last paths in the paths cell', function() {
      const html = cell(loggedRow, 'paths');

      expect(html).toContain(t('first_path'));
      expect(html).toContain('title="/#/games"');
      expect(html).toContain(t('last_path'));
      expect(html).toContain('title="/#/games/:id/characters"');
      expect(html).toContain('font-monospace text-truncate');
    });

    it('renders the session first path, reason and logged flag in the session cell', function() {
      const html = cell(loggedRow, 'session');

      expect(html).toContain(t('session_first_path'));
      expect(html).toContain('title="unresolved"');
      expect(html).toContain(detail(t('creation_reason'), t('creation_reasons.login_rotation')));
      expect(html).toContain(detail(t('first_seen_logged'), t('yes')));
    });

    CREATION_REASONS.forEach((reason) => {
      it(`translates the ${reason} creation reason`, function() {
        const label = t(`creation_reasons.${reason}`);

        expect(label).not.toContain('creation_reasons');
        expect(cell({ ...loggedRow, sessionCreationReason: reason }, 'session'))
          .toContain(detail(t('creation_reason'), label));
      });
    });

    it('falls back to the raw value for an unknown reason', function() {
      expect(cell({ ...loggedRow, sessionCreationReason: 'brand_new_reason' }, 'session'))
        .toContain(detail(t('creation_reason'), 'brand_new_reason'));
    });

    it('renders no for a false logged flag', function() {
      expect(cell({ ...loggedRow, sessionFirstSeenLogged: false }, 'session'))
        .toContain(detail(t('first_seen_logged'), t('no')));
    });

    it('renders unknown for null paths', function() {
      const html = cell({ ...loggedRow, firstPath: null, lastPath: null }, 'paths');

      expect(html).toContain(detail(t('first_path'), unknown));
      expect(html).toContain(detail(t('last_path'), unknown));
    });

    it('renders unknown for a null session first path, reason and logged flag', function() {
      const html = cell({
        ...loggedRow, sessionFirstPath: null, sessionCreationReason: null, sessionFirstSeenLogged: null,
      }, 'session');

      expect(html).toContain(detail(t('session_first_path'), unknown));
      expect(html).toContain(detail(t('creation_reason'), t('unknown')));
      expect(html).toContain(detail(t('first_seen_logged'), t('unknown')));
      expect(html).not.toContain(detail(t('first_seen_logged'), t('no')));
    });
  });

  it('marks only the active header as sorted descending', function() {
    const html = render({ sort: 'hits' });

    expect((html.match(/aria-sort="descending"/g) || []).length).toBe(1);
    expect((html.match(/aria-sort="none"/g) || []).length).toBe(3);
    expect(html).toContain('▼');
    expect(html).toContain(t('sorted_descending'));
  });
});
