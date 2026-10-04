import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StatisticsKpiTile
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/StatisticsKpiTile.jsx';

describe('StatisticsKpiTile', function() {
  const props = {
    label: 'Visits', value: '1,234', href: '#/staff/statistics/visits?range=7d', testId: 'tile',
  };
  const render = (overrides = {}, ...children) => renderToStaticMarkup(
    React.createElement(StatisticsKpiTile, { ...props, ...overrides }, ...children),
  );

  it('renders a card in a responsive column', function() {
    const html = render();

    expect(html).toContain('class="col-12 col-sm-6 col-lg-4 mb-3"');
    expect(html).toContain('class="card position-relative h-100" data-testid="tile"');
  });

  it('renders the label as a stretched link to the href', function() {
    expect(render()).toContain(
      '<a class="stretched-link text-reset text-decoration-none" href="#/staff/statistics/visits?range=7d">Visits</a>',
    );
  });

  it('renders the value', function() {
    expect(render()).toContain('<p class="display-6 mb-1" data-testid="tile-value">1,234</p>');
  });

  it('renders the children after the value', function() {
    const html = render({}, React.createElement('p', { key: 'a' }, 'secondary line'));

    expect(html).toContain('secondary line');
    expect(html.indexOf('secondary line')).toBeGreaterThan(html.indexOf('1,234'));
  });

  it('renders without children', function() {
    expect(render()).not.toContain('secondary line');
  });
});
