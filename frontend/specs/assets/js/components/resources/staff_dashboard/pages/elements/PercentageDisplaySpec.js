import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PercentageDisplay from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/PercentageDisplay.jsx';

describe('PercentageDisplay', function() {
  [
    { value: 30, limit: 100, expectedText: '30%', expectedClass: 'text-success' },
    { value: 65, limit: 100, expectedText: '65%', expectedClass: 'text-warning' },
    { value: 90, limit: 100, expectedText: '90%', expectedClass: 'text-danger' },
    { value: 150, limit: 100, expectedText: '150%', expectedClass: 'text-overlimit' },
  ].forEach(({ value, limit, expectedText, expectedClass }) => {
    it(`renders ${expectedText} with class '${expectedClass}'`, function() {
      const html = renderToStaticMarkup(
        React.createElement(PercentageDisplay, { value, limit, thresholds: undefined })
      );

      expect(html).toContain(expectedText);
      expect(html).toContain(expectedClass);
    });
  });

  it('rounds the percentage to the nearest integer', function() {
    const html = renderToStaticMarkup(
      React.createElement(PercentageDisplay, { value: 1, limit: 3, thresholds: undefined })
    );

    expect(html).toContain('33%');
  });

  it('renders 0% when limit is 0, without dividing by zero', function() {
    const html = renderToStaticMarkup(
      React.createElement(PercentageDisplay, { value: 10, limit: 0, thresholds: undefined })
    );

    expect(html).toContain('0%');
    expect(html).toContain('text-success');
  });

  it('honors custom thresholds', function() {
    const html = renderToStaticMarkup(
      React.createElement(PercentageDisplay, { value: 80, limit: 100, thresholds: [0.7, 1.2] })
    );

    expect(html).toContain('text-danger');
  });
});
