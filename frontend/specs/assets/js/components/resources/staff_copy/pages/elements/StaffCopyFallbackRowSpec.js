import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffCopyFallbackRow from '../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/StaffCopyFallbackRow.jsx';

describe('StaffCopyFallbackRow', function() {
  it('renders the row name in a cell', function() {
    const html = renderToStaticMarkup(
      React.createElement('table', null, React.createElement('tbody', null, React.createElement('tr', null,
        React.createElement(StaffCopyFallbackRow, { row: { id: 1, name: 'Sword' } }),
      ))),
    );

    expect(html).toContain('<td>Sword</td>');
  });
});
