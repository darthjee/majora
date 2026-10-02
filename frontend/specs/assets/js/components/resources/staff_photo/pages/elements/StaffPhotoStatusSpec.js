import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffPhotoStatus from '../../../../../../../../assets/js/components/resources/staff_photo/pages/elements/StaffPhotoStatus.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

/**
 * @description Renders the status element for a photo.
 * @param {object} photo - Photo row.
 * @returns {string} Markup.
 */
function render(photo) {
  return renderToStaticMarkup(React.createElement(StaffPhotoStatus, { photo }));
}

describe('StaffPhotoStatus', function() {
  it('renders the ready badge', function() {
    const html = render({ ready: true, replace_in_progress: false });

    expect(html).toContain('bg-success');
    expect(html).toContain(Translator.t('staff_photos_page.status_ready'));
    expect(html).not.toContain(Translator.t('staff_photos_page.status_replace_in_progress'));
  });

  it('renders the not-ready badge', function() {
    const html = render({ ready: false, replace_in_progress: false });

    expect(html).toContain('bg-secondary');
    expect(html).toContain(Translator.t('staff_photos_page.status_not_ready'));
  });

  it('adds the replace-in-progress badge while a replace is in flight', function() {
    const html = render({ ready: true, replace_in_progress: true });

    expect(html).toContain('bg-warning');
    expect(html).toContain(Translator.t('staff_photos_page.status_replace_in_progress'));
  });
});
