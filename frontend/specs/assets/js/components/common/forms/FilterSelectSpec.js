import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import FilterSelect from '../../../../../../assets/js/components/common/forms/FilterSelect.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('FilterSelect', function() {
  const options = [
    { value: 'alive', label: 'Alive' },
    { value: 'slain', label: 'Slain' },
  ];

  it('renders a label linked to the select via id/htmlFor', function() {
    const html = renderToStaticMarkup(
      React.createElement(FilterSelect, {
        id: 'npc-filter-status', label: 'Status', value: '', options, onChange: Noop.noop,
      })
    );

    expect(html).toContain('id="npc-filter-status"');
    expect(html).toContain('for="npc-filter-status"');
    expect(html).toContain('Status');
  });

  it('defaults data-testid to the given id', function() {
    const html = renderToStaticMarkup(
      React.createElement(FilterSelect, {
        id: 'npc-filter-status', label: 'Status', value: '', options, onChange: Noop.noop,
      })
    );

    expect(html).toContain('data-testid="npc-filter-status"');
  });

  it('uses the given testId over the id when provided', function() {
    const html = renderToStaticMarkup(
      React.createElement(FilterSelect, {
        id: 'npc-filter-status', label: 'Status', value: '', options, onChange: Noop.noop, testId: 'custom-testid',
      })
    );

    expect(html).toContain('data-testid="custom-testid"');
    expect(html).not.toContain('data-testid="npc-filter-status"');
  });

  it('renders a leading blank option followed by every given option', function() {
    const html = renderToStaticMarkup(
      React.createElement(FilterSelect, {
        id: 'npc-filter-status', label: 'Status', value: '', options, onChange: Noop.noop,
      })
    );

    expect(html).toContain('<option value=""');
    expect(html).toContain('value="alive"');
    expect(html).toContain('Alive');
    expect(html).toContain('value="slain"');
    expect(html).toContain('Slain');
  });

  it('marks the current value as selected', function() {
    const html = renderToStaticMarkup(
      React.createElement(FilterSelect, {
        id: 'npc-filter-status', label: 'Status', value: 'slain', options, onChange: Noop.noop,
      })
    );
    const selectStart = html.indexOf('<select');

    expect(html.indexOf('selected=""', selectStart)).toBeGreaterThan(-1);
  });
});
