import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffStatisticsTabs
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsTabs.jsx';
import { DEFAULTS } from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsFilters.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffStatisticsTabs', function() {
  const render = (props) => renderToStaticMarkup(React.createElement(StaffStatisticsTabs, props));

  it('renders every tab with its label', function() {
    const html = render({ activeTab: 'overview', filters: { ...DEFAULTS } });

    expect(html).toContain('nav nav-tabs flex-wrap mb-3');
    ['overview', 'visits', 'visitors', 'duration', 'domains', 'users', 'visit_list'].forEach((key) => {
      expect(html).toContain(Translator.t(`staff_statistics_page.tabs.${key}`));
    });
  });

  it('uses bare paths when every filter is at its default', function() {
    const html = render({ activeTab: 'overview', filters: { ...DEFAULTS } });

    expect(html).toContain('href="#/staff/statistics"');
    expect(html).toContain('href="#/staff/statistics/visit-list"');
  });

  it('carries the filters across tabs', function() {
    const html = render({ activeTab: 'visits', filters: { ...DEFAULTS, range: '7d', audience: 'anonymous' } });

    expect(html).toContain('href="#/staff/statistics/users?range=7d&amp;audience=anonymous"');
  });

  it('marks only the active tab', function() {
    const html = render({ activeTab: 'visits', filters: { ...DEFAULTS } });

    expect(html).toContain('<a class="nav-link active" aria-current="page" href="#/staff/statistics/visits">');
    expect(html.match(/aria-current/g).length).toBe(1);
  });
});
