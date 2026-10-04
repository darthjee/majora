import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffStatisticsShell
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsShell.jsx';
import StaffStatisticsFilterBarHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/helpers/StaffStatisticsFilterBarHelper.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffStatisticsShell', function() {
  let originalWindow;
  let filterBarState;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/staff/statistics/visits?range=90d&page=3' } };
    spyOn(StaffStatisticsFilterBarHelper, 'render').and.callFake((state) => {
      filterBarState = state;
      return React.createElement('div', { 'data-testid': 'filter-bar' });
    });
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  const render = (props) => renderToStaticMarkup(
    React.createElement(StaffStatisticsShell, props, React.createElement('p', null, 'body')),
  );

  it('renders the title, filter bar, tabs, then the body in order', function() {
    const html = render({ tab: 'visits' });
    const order = [
      Translator.t('staff_statistics_page.title'), 'data-testid="filter-bar"', 'data-testid="statistics-tabs"', '<p>body</p>',
    ].map((part) => html.indexOf(part));

    expect(order.every((index) => index >= 0)).toBeTrue();
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('carries the current filters into the tab links, without pagination', function() {
    const html = render({ tab: 'visits' });

    expect(html).toContain('href="#/staff/statistics/users?range=90d"');
    expect(html).toContain('<a class="nav-link active" aria-current="page" href="#/staff/statistics/visits?range=90d">');
  });

  it('passes the resolved granularity to the filter bar', function() {
    render({ tab: 'visits', resolvedGranularity: 'week' });

    expect(filterBarState.resolvedGranularity).toBe('week');
  });

  it('shows the granularity in the filter bar by default', function() {
    render({ tab: 'visits' });

    expect(filterBarState.showGranularity).toBeTrue();
  });

  it('passes a hidden granularity to the filter bar', function() {
    render({ tab: 'overview', showGranularity: false });

    expect(filterBarState.showGranularity).toBeFalse();
  });

  it('falls back to the overview tab for an unknown key', function() {
    expect(render({ tab: 'nope' })).toContain('<a class="nav-link active" aria-current="page" href="#/staff/statistics?range=90d">');
  });
});
