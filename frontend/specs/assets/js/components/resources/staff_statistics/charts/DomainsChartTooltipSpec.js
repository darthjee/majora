import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DomainsChartTooltip
  from '../../../../../../../assets/js/components/resources/staff_statistics/charts/DomainsChartTooltip.jsx';

describe('DomainsChartTooltip', function() {
  const row = {
    id: 3, domain: 'example.com', group: 'Search', label: 'example.com', anonymous: 7, logged_in: 3,
    visits: 10, loggedInShare: 0.3, unknown: false,
  };

  const render = (props) => renderToStaticMarkup(React.createElement(DomainsChartTooltip, props));

  it('renders nothing while inactive', function() {
    expect(render({ active: false, payload: [{ payload: row }] })).toBe('');
  });

  it('renders nothing without a payload', function() {
    expect(render({ active: true })).toBe('');
  });

  it('renders nothing with an empty payload', function() {
    expect(render({ active: true, payload: [] })).toBe('');
  });

  it('renders the hovered row', function() {
    const html = render({ active: true, payload: [{ payload: row }], series: ['anonymous'] });

    expect(html).toContain('data-testid="statistics-domains-tooltip"');
    expect(html).toContain('example.com');
  });
});
