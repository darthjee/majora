import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DashboardCard from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/DashboardCard.jsx';

describe('DashboardCard', function() {
  it('renders the top and actions slots inside a bootstrap card shell', function() {
    const html = renderToStaticMarkup(
      React.createElement(DashboardCard, {
        top: React.createElement('div', null, 'top-content'),
        actions: React.createElement('div', null, 'actions-content'),
      })
    );

    expect(html).toContain('card h-100');
    expect(html).toContain('top-content');
    expect(html).toContain('actions-content');
  });

  it('does not wrap the card in a link', function() {
    const html = renderToStaticMarkup(
      React.createElement(DashboardCard, {
        top: React.createElement('div', null, 'top'),
        actions: React.createElement('div', null, 'actions'),
      })
    );

    expect(html).not.toContain('<a ');
  });
});
