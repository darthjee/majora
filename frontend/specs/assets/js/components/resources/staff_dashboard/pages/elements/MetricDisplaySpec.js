import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MetricDisplay from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/MetricDisplay.jsx';

describe('MetricDisplay', function() {
  [
    { value: 30, limit: 100, expectedText: '30%', expectedClass: 'text-success' },
    { value: 65, limit: 100, expectedText: '65%', expectedClass: 'text-warning' },
    { value: 90, limit: 100, expectedText: '90%', expectedClass: 'text-danger' },
    { value: 150, limit: 100, expectedText: '150%', expectedClass: 'text-overlimit' },
  ].forEach(({ value, limit, expectedText, expectedClass }) => {
    it(`renders ${expectedText} with class '${expectedClass}'`, function() {
      const html = renderToStaticMarkup(
        React.createElement(MetricDisplay, { value, limit, valueType: 'bytes', thresholds: undefined })
      );

      expect(html).toContain(expectedText);
      expect(html).toContain(expectedClass);
      expect(html).toContain(`${value} B / ${limit} B`);
    });
  });

  it('rounds the percentage to the nearest integer', function() {
    const html = renderToStaticMarkup(
      React.createElement(MetricDisplay, { value: 1, limit: 3, valueType: 'bytes', thresholds: undefined })
    );

    expect(html).toContain('33%');
    expect(html).toContain('1 B / 3 B');
  });

  it('renders 0% when limit is 0, without dividing by zero', function() {
    const html = renderToStaticMarkup(
      React.createElement(MetricDisplay, { value: 10, limit: 0, valueType: 'bytes', thresholds: undefined })
    );

    expect(html).toContain('0%');
    expect(html).toContain('text-success');
    expect(html).toContain('10 B / 0 B');
  });

  it('honors custom thresholds', function() {
    const html = renderToStaticMarkup(
      React.createElement(MetricDisplay, { value: 80, limit: 100, valueType: 'bytes', thresholds: [0.7, 1.2] })
    );

    expect(html).toContain('text-danger');
  });

  describe('value/limit line', function() {
    [
      { value: 920, limit: 920, expectedLine: '920 B / 920 B' },
      { value: 921, limit: 921, expectedLine: '0.9 KB / 0.9 KB' },
      { value: 943103, limit: 943103, expectedLine: '921 KB / 921 KB' },
      { value: 943104, limit: 943104, expectedLine: '0.9 MB / 0.9 MB' },
      { value: 965738495, limit: 965738495, expectedLine: '921 MB / 921 MB' },
      { value: 965738496, limit: 965738496, expectedLine: '0.9 GB / 0.9 GB' },
    ].forEach(({ value, limit, expectedLine }) => {
      it(`renders '${expectedLine}' for value/limit ${value}`, function() {
        const html = renderToStaticMarkup(
          React.createElement(MetricDisplay, { value, limit, valueType: 'bytes', thresholds: undefined })
        );

        expect(html).toContain(expectedLine);
      });
    });

    it('converts value and limit independently, in different units', function() {
      const html = renderToStaticMarkup(
        React.createElement(MetricDisplay, { value: 10, limit: 943104, valueType: 'bytes', thresholds: undefined })
      );

      expect(html).toContain('10 B / 0.9 MB');
    });

    it('trims a trailing zero for whole converted numbers', function() {
      const html = renderToStaticMarkup(
        React.createElement(MetricDisplay, { value: 2048, limit: 2048, valueType: 'bytes', thresholds: undefined })
      );

      expect(html).toContain('2 KB / 2 KB');
    });

    it('keeps a single decimal place when it is not zero', function() {
      const html = renderToStaticMarkup(
        React.createElement(MetricDisplay, { value: 2560, limit: 2560, valueType: 'bytes', thresholds: undefined })
      );

      expect(html).toContain('2.5 KB / 2.5 KB');
    });
  });
});
