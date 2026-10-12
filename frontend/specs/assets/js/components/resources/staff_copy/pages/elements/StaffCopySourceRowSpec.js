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
      slug: 'stub_type',
      row: { id: 4, name: 'Sword', copied_to_target: true },
      selected: true,
      disabled: false,
      onToggle: jasmine.createSpy('onToggle'),
    };
  });

  afterEach(function() {
    StaffCopyRows.unregister('stub_type');
  });

  it('renders the checkbox, the fallback name cell and the status cell', function() {
    const html = render();

    expect(html).toContain('type="checkbox"');
    expect(html).toContain('checked=""');
    expect(html).toContain('<td>Sword</td>');
    expect(html).toContain(Translator.t('staff_copies_page.copied_to_target'));
  });

  it('renders the registered row cells instead of the fallback', function() {
    StaffCopyRows.register('stub_type', StubRow);

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

  describe('with a faction row whose name is taken in the target', function() {
    it('renders the faction cells, the name-taken badge and an enabled checkbox', function() {
      const html = render({
        slug: 'factions',
        selected: false,
        row: { id: 9, name: 'Thieves Guild', photo: null, copied_to_target: false, name_taken_in_target: true },
      });

      expect(html).toContain('<td>Thieves Guild</td>');
      expect(html).toContain(Translator.t('staff_copies_page.entity_error.name_taken'));
      expect(html).toContain('type="checkbox"');
      expect(html).not.toContain('disabled=""');
    });
  });
});
