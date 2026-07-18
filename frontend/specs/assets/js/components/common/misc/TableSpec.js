import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import Table from '../../../../../../assets/js/components/common/misc/Table.jsx';

describe('Table', function() {
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
  ];
  const rows = [
    { id: 1, name: 'Jane', email: 'jane@example.com' },
    { id: 2, name: 'John', email: 'john@example.com' },
  ];

  it('renders the column headers', function() {
    const html = renderToStaticMarkup(React.createElement(Table, { columns, rows }));

    expect(html).toContain('Name');
    expect(html).toContain('Email');
  });

  it('renders each row with the matching column values', function() {
    const html = renderToStaticMarkup(React.createElement(Table, { columns, rows }));

    expect(html).toContain('Jane');
    expect(html).toContain('jane@example.com');
    expect(html).toContain('John');
    expect(html).toContain('john@example.com');
  });

  it('renders no actions column when renderActions is absent', function() {
    const html = renderToStaticMarkup(React.createElement(Table, { columns, rows }));

    expect(html).toContain('<table');
  });

  it('renders per-row actions when renderActions is provided', function() {
    const renderActions = (row) => React.createElement('span', null, `action-${row.id}`);
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns, rows, renderActions })
    );

    expect(html).toContain('action-1');
    expect(html).toContain('action-2');
  });
});
