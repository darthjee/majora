import { renderToStaticMarkup } from 'react-dom/server';
import StatisticsUsersTableHelper, { USERS_COLUMNS, formatLastSeen }
  from '../../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/helpers/StatisticsUsersTableHelper.jsx';
import StatisticsBucketFormatter
  from '../../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsBucketFormatter.js';
import Translator from '../../../../../../../../../assets/js/i18n/Translator.js';

describe('StatisticsUsersTableHelper', function() {
  const t = (key) => Translator.t(`staff_statistics_page.users.${key}`);
  const filters = { range: '7d', granularity: 'auto', audience: 'all' };
  const userRow = {
    id: 5,
    name: 'Ana',
    displayName: 'Ana S.',
    email: 'ana@example.com',
    visits: 1234,
    timeOnSiteSeconds: 3600,
    averageDurationSeconds: 274,
    hits: 40,
    domains: ['example.com', 'unknown'],
    lastSeenAt: '2026-01-07T10:00:00Z',
  };
  let handlers;

  beforeEach(function() {
    handlers = {
      onRowClick: jasmine.createSpy('onRowClick'),
      onRowKeyDown: jasmine.createSpy('onRowKeyDown'),
    };
  });

  const element = (state) => StatisticsUsersTableHelper.render({ rows: [userRow], sort: 'visits', filters, ...state }, handlers);
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

    expect(html).toContain('data-testid="statistics-users-table"');
    expect(html).toContain('table-hover');
    expect(html).toContain('table-responsive');
    expect(html).toContain(t('user'));
    USERS_COLUMNS.forEach(({ labelKey }) => expect(html).toContain(t(labelKey)));
  });

  it('renders the user cell with the display name, email and profile link', function() {
    const html = render();

    expect(html).toContain('Ana');
    expect(html).toContain('Ana S.');
    expect(html).toContain('ana@example.com');
    expect(html).toContain('href="#/staff/users/5"');
    expect(html).toContain(t('profile'));
  });

  it('omits the display name when not set', function() {
    const html = render({ rows: [{ ...userRow, displayName: null }] });

    expect(html).not.toContain('Ana S.');
    expect(html).toContain('ana@example.com');
  });

  it('formats the metrics', function() {
    const html = render();

    expect(html).toContain(`<td>${StatisticsBucketFormatter.count(1234)}</td>`);
    expect(html).toContain('<td>1h 0m</td>');
    expect(html).toContain('<td>4m 34s</td>');
    expect(html).toContain('<td>40</td>');
    expect(html).toContain('<td>example.com, unknown</td>');
    expect(html).toContain(`<td>${formatLastSeen('2026-01-07T10:00:00Z')}</td>`);
  });

  it('renders a dash for no domains', function() {
    expect(render({ rows: [{ ...userRow, domains: [] }] })).toContain('<td>—</td>');
  });

  it('renders the rows as keyboard accessible links', function() {
    const html = render();

    expect(html).toContain('role="link"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('data-testid="statistics-users-row-5"');
  });

  it('renders no rows for an empty list', function() {
    expect(render({ rows: [] })).not.toContain('role="link"');
  });

  it('links every sortable header to its sort, keeping the filters', function() {
    const html = render();

    expect(html).toContain('href="#/staff/statistics/users?range=7d"');
    ['time_on_site', 'average_duration', 'hits', 'last_seen'].forEach((key) => {
      expect(html).toContain(`href="#/staff/statistics/users?range=7d&amp;sort=${key}"`);
    });
  });

  it('does not link the user and domains headers', function() {
    const headers = findAll(element(), (node) => node.type === 'th');
    const plain = headers.filter((header) => findAll(header.props.children, (node) => node.type === 'a').length === 0);

    expect(plain.length).toBe(2);
  });

  it('marks the active header as sorted descending', function() {
    const html = render({ sort: 'hits' });

    expect((html.match(/aria-sort="descending"/g) || []).length).toBe(1);
    expect(html).toContain('▼');
    expect(html).toContain(t('sorted_descending'));
  });

  describe('handlers', function() {
    const rowsOf = (tree) => findAll(tree, (node) => node.props?.role === 'link');
    const profileLinks = (tree) => findAll(tree, (node) => node.type === 'a' && node.props.className === 'small');

    it('calls onRowClick and onRowKeyDown with the row', function() {
      const [row] = rowsOf(element());
      const event = { key: 'Enter' };
      row.props.onClick();
      row.props.onKeyDown(event);

      expect(handlers.onRowClick).toHaveBeenCalledWith(userRow);
      expect(handlers.onRowKeyDown).toHaveBeenCalledWith(event, userRow);
    });

    it('stops the profile link click from reaching the row', function() {
      const [link] = profileLinks(element());
      const event = { stopPropagation: jasmine.createSpy('stopPropagation') };
      link.props.onClick(event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(handlers.onRowClick).not.toHaveBeenCalled();
    });
  });

  describe('formatLastSeen', function() {
    it('formats a timestamp as date and time', function() {
      const expected = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
        .format(new Date('2026-01-07T10:00:00Z'));

      expect(formatLastSeen('2026-01-07T10:00:00Z')).toBe(expected);
    });

    it('renders a dash when missing', function() {
      expect(formatLastSeen(null)).toBe('—');
    });
  });
});
