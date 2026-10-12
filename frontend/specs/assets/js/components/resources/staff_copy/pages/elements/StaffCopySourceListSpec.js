import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffCopySourceList from '../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/StaffCopySourceList.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffCopySourceList', function() {
  let props;

  const render = (overrides = {}) => renderToStaticMarkup(
    React.createElement(StaffCopySourceList, { ...props, ...overrides }),
  );

  beforeEach(function() {
    props = {
      selection: { type: 'unregistered_type', from: 'a', to: 'b' },
      rows: [{ id: 1, name: 'Sword' }, { id: 2, name: 'Shield' }],
      pagination: { page: 1, pages: 2, perPage: 10 },
      selectedIds: [],
      running: false,
      handlers: {
        onToggle: jasmine.createSpy('onToggle'),
        onToggleAll: jasmine.createSpy('onToggleAll'),
        onCopy: jasmine.createSpy('onCopy'),
      },
    };
  });

  it('renders the empty message when there are no rows', function() {
    const html = render({ rows: [] });

    expect(html).toContain(Translator.t('staff_copies_page.empty'));
    expect(html).not.toContain('<table');
  });

  it('renders the headers, one row per entry and the pagination keeping the selection', function() {
    const html = render();

    expect(html).toContain(Translator.t('staff_copies_page.select_all'));
    expect(html).toContain(`<th>${Translator.t('staff_copies_page.name_column')}</th>`);
    expect(html).toContain(`<th>${Translator.t('staff_copies_page.status_column')}</th>`);
    expect(html).toContain('<td>Sword</td>');
    expect(html).toContain('<td>Shield</td>');
    expect(html).toContain('type=unregistered_type');
    expect(html).toContain('from=a');
    expect(html).toContain('to=b');
  });

  it('disables the copy button when nothing is selected', function() {
    const button = StaffCopySourceList(props).props.children[0].props.children;

    expect(button.props.disabled).toBe(true);
  });

  it('enables the copy button with a selection and calls onCopy', function() {
    const button = StaffCopySourceList({ ...props, selectedIds: [1] }).props.children[0].props.children;

    expect(button.props.disabled).toBe(false);
    button.props.onClick();
    expect(props.handlers.onCopy).toHaveBeenCalled();
  });

  it('disables the copy button while a run is in progress', function() {
    const button = StaffCopySourceList({ ...props, selectedIds: [1], running: true }).props.children[0].props.children;

    expect(button.props.disabled).toBe(true);
  });

  it('checks the select-all box when every row of the page is selected', function() {
    const html = render({ selectedIds: [1, 2] });

    expect(html.match(/checked=""/g).length).toBe(3);
  });
});
