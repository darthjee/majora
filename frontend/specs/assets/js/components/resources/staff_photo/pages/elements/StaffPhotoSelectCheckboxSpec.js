import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffPhotoSelectCheckbox from '../../../../../../../../assets/js/components/resources/staff_photo/pages/elements/StaffPhotoSelectCheckbox.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffPhotoSelectCheckbox', function() {
  const photo = { id: 4 };

  it('renders a labelled checkbox', function() {
    const html = renderToStaticMarkup(React.createElement(StaffPhotoSelectCheckbox, {
      photo, checked: true, disabled: false, onToggle: jasmine.createSpy('onToggle'),
    }));

    expect(html).toContain('type="checkbox"');
    expect(html).toContain(`aria-label="${Translator.t('staff_photos_page.select_photo')}"`);
    expect(html).toContain('checked=""');
  });

  it('toggles the photo on change', function() {
    const onToggle = jasmine.createSpy('onToggle');
    const input = StaffPhotoSelectCheckbox({
      photo, checked: false, disabled: true, onToggle,
    });

    input.props.onChange();

    expect(input.props.disabled).toBe(true);
    expect(onToggle).toHaveBeenCalledWith(photo);
  });
});
