import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffCopySourceRow from '../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/StaffCopySourceRow.jsx';
import StaffCopyRows from '../../../../../../../../assets/js/components/resources/staff_copy/pages/helpers/StaffCopyRows.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

/**
 * @description Stub registered row rendering two cells.
 * @param {object} props - Component props.
 * @param {object} props.row - The source row.
 * @param {boolean} props.selected - Whether the row is selected.
 * @returns {React.ReactElement} the cells.
 */
function StubRow({ row, selected }) {
  return React.createElement(React.Fragment, null,
    React.createElement('td', null, `stub:${row.name}`),
    React.createElement('td', null, selected ? 'selected' : 'unselected'),
  );
}

describe('StaffCopySourceRow', function() {
  let props;

  /**
   * @description Renders the row inside a table.
   * @param {object} overrides - Prop overrides.
   * @returns {string} the markup.
   */
  function render(overrides = {}) {
    return renderToStaticMarkup(React.createElement('table', null, React.createElement('tbody', null,
      React.createElement(StaffCopySourceRow, { ...props, ...overrides }),
    )));
  }

  beforeEach(function() {
    props = {
      slug: 'items',
      row: { id: 4, name: 'Sword', copied_to_target: true },
      selected: true,
      disabled: false,
      onToggle: jasmine.createSpy('onToggle'),
    };
  });

  afterEach(function() {
    StaffCopyRows.unregister('items');
  });

  it('renders the checkbox, the fallback name cell and the status cell', function() {
    const html = render();

    expect(html).toContain('type="checkbox"');
    expect(html).toContain('checked=""');
    expect(html).toContain('<td>Sword</td>');
    expect(html).toContain(Translator.t('staff_copies_page.copied_to_target'));
  });

  it('renders the registered row cells instead of the fallback', function() {
    StaffCopyRows.register('items', StubRow);

    const html = render();

    expect(html).toContain('<td>stub:Sword</td>');
    expect(html).toContain('<td>selected</td>');
    expect(html).not.toContain('<td>Sword</td>');
  });

  it('toggles the row from the checkbox', function() {
    const checkbox = StaffCopySourceRow(props).props.children[0].props.children;

    checkbox.props.onChange();

    expect(props.onToggle).toHaveBeenCalledWith(props.row);
  });

  it('disables the checkbox while running', function() {
    expect(render({ disabled: true })).toContain('disabled=""');
  });
});
