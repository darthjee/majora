import { renderToStaticMarkup } from 'react-dom/server';
import DomainsChartTooltipHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/charts/helpers/DomainsChartTooltipHelper.jsx';
import StatisticsBucketFormatter
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsBucketFormatter.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('DomainsChartTooltipHelper', function() {
  const t = (key) => Translator.t(`staff_statistics_page.domains.${key}`);
  const count = (value) => StatisticsBucketFormatter.count(value);
  const percent = (value) => StatisticsBucketFormatter.percent(value);
  const rowFor = (overrides = {}) => ({
    id: 3, domain: 'example.com', group: 'Search', label: 'example.com',
    anonymous: 1200, logged_in: 800, visits: 2000, loggedInShare: 0.4, unknown: false, ...overrides,
  });
  const unknownRow = () => rowFor({
    id: 'unknown', domain: null, group: null, label: t('unknown'), unknown: true,
  });

  const render = (row, options = {}) => renderToStaticMarkup(DomainsChartTooltipHelper.render(row, options));

  it('renders the tooltip test id and the domain label', function() {
    const html = render(rowFor());

    expect(html).toContain('data-testid="statistics-domains-tooltip"');
    expect(html).toContain('example.com');
  });

  it('shows the group', function() {
    expect(render(rowFor())).toContain(`${t('group')}: Search`);
  });

  it('omits the group for the unknown row', function() {
    const html = render(unknownRow());

    expect(html).toContain(t('unknown'));
    expect(html).not.toContain(`${t('group')}:`);
  });

  it('omits a missing group', function() {
    expect(render(rowFor({ group: null }))).not.toContain(`${t('group')}:`);
  });

  it('shows both counts, the total and the logged-in share', function() {
    const html = render(rowFor(), { series: ['anonymous', 'logged_in'] });

    expect(html).toContain(`${t('anonymous')}: ${count(1200)}`);
    expect(html).toContain(`${t('logged_in')}: ${count(800)}`);
    expect(html).toContain(`${t('total')}: ${count(2000)}`);
    expect(html).toContain(`${t('logged_in_share')}: ${percent(0.4)}`);
  });

  it('defaults to both series without series', function() {
    expect(render(rowFor())).toContain(`${t('logged_in_share')}: ${percent(0.4)}`);
  });

  it('hides the share for a row without visits', function() {
    const html = render(rowFor({
      anonymous: 0, logged_in: 0, visits: 0, loggedInShare: null,
    }), { series: ['anonymous', 'logged_in'] });

    expect(html).not.toContain(t('logged_in_share'));
    expect(html).toContain(`${t('total')}: 0`);
  });

  it('omits the hidden series and the share with a filtered audience', function() {
    const html = render(rowFor(), { series: ['logged_in'] });

    expect(html).not.toContain(`${t('anonymous')}:`);
    expect(html).toContain(`${t('logged_in')}: ${count(800)}`);
    expect(html).not.toContain(t('logged_in_share'));
  });
});
