import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SizeDisplay from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/SizeDisplay.jsx';

describe('SizeDisplay', function() {
  [
    { value: 920, expected: '920 B' },
    { value: 921, expected: '0.9 KB' },
    { value: 943103, expected: '921 KB' },
    { value: 943104, expected: '0.9 MB' },
    { value: 965738495, expected: '921 MB' },
    { value: 965738496, expected: '0.9 GB' },
  ].forEach(({ value, expected }) => {
    it(`renders '${expected}' for a value of ${value}`, function() {
      const html = renderToStaticMarkup(
        React.createElement(SizeDisplay, { value, valueType: 'bytes' })
      );

      expect(html).toContain(expected);
    });
  });

  it('trims a trailing zero for whole converted numbers', function() {
    const html = renderToStaticMarkup(
      React.createElement(SizeDisplay, { value: 2048, valueType: 'bytes' })
    );

    expect(html).toContain('2 KB');
  });
});
