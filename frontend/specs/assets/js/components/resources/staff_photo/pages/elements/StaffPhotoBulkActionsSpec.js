import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffPhotoBulkActions from '../../../../../../../../assets/js/components/resources/staff_photo/pages/elements/StaffPhotoBulkActions.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

/**
 * @description Builds the bulk bar element tree by calling the component directly.
 * @param {object} props - Component props.
 * @returns {{toggle: object, resize: object, del: object}} The interactive elements.
 */
function parts(props) {
  const [label, , resize, del] = StaffPhotoBulkActions(props).props.children;
  const [toggle] = label.props.children;

  return { toggle, resize, del };
}

describe('StaffPhotoBulkActions', function() {
  let props;

  beforeEach(function() {
    props = {
      count: 2,
      allSelected: false,
      running: false,
      onToggleAll: jasmine.createSpy('onToggleAll'),
      onBulk: jasmine.createSpy('onBulk'),
    };
  });

  it('renders the select-all toggle, count and bulk buttons', function() {
    const html = renderToStaticMarkup(React.createElement(StaffPhotoBulkActions, props));

    expect(html).toContain(Translator.t('staff_photos_page.select_all_page'));
    expect(html).toContain(Translator.t('staff_photos_page.bulk_selected').replace('{{count}}', 2));
    expect(html).toContain(Translator.t('staff_photos_page.bulk_resize'));
    expect(html).toContain(Translator.t('staff_photos_page.bulk_delete'));
  });

  it('enables the buttons with a selection and calls onBulk with the action', function() {
    const { toggle, resize, del } = parts(props);

    resize.props.onClick();
    del.props.onClick();

    expect(resize.props.disabled).toBe(false);
    expect(del.props.disabled).toBe(false);
    expect(toggle.props.disabled).toBe(false);
    expect(toggle.props.onChange).toBe(props.onToggleAll);
    expect(props.onBulk.calls.allArgs()).toEqual([['resize'], ['delete']]);
  });

  it('disables the buttons when nothing is selected', function() {
    const { resize, del } = parts({ ...props, count: 0 });

    expect(resize.props.disabled).toBe(true);
    expect(del.props.disabled).toBe(true);
  });

  it('disables everything while a bulk job runs', function() {
    const { toggle, resize, del } = parts({ ...props, running: true });

    expect(toggle.props.disabled).toBe(true);
    expect(resize.props.disabled).toBe(true);
    expect(del.props.disabled).toBe(true);
  });

  it('checks the toggle when all are selected', function() {
    expect(parts({ ...props, allSelected: true }).toggle.props.checked).toBe(true);
  });
});
