import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffPhotoRowActions from '../../../../../../../../assets/js/components/resources/staff_photo/pages/elements/StaffPhotoRowActions.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

/**
 * @description Builds the row actions element tree by calling the component directly.
 * @param {object} photo - Photo row.
 * @param {object} handlers - onReplace/onDelete spies.
 * @returns {{replace: object, del: object}} The two button elements.
 */
function buttons(photo, handlers) {
  const [replace, del] = StaffPhotoRowActions({ photo, ...handlers }).props.children;

  return { replace, del };
}

describe('StaffPhotoRowActions', function() {
  let handlers;

  beforeEach(function() {
    handlers = { onReplace: jasmine.createSpy('onReplace'), onDelete: jasmine.createSpy('onDelete') };
  });

  it('renders enabled Replace and Delete buttons for a regular photo', function() {
    const photo = { id: 1, path: '/p.png', replace_in_progress: false };
    const html = renderToStaticMarkup(React.createElement(StaffPhotoRowActions, { photo, ...handlers }));
    const { replace, del } = buttons(photo, handlers);

    expect(html).toContain(Translator.t('staff_photos_page.replace'));
    expect(html).toContain(Translator.t('staff_photos_page.delete'));
    expect(replace.props.disabled).toBe(false);
    expect(del.props.disabled).toBe(false);
  });

  it('passes the photo to the handlers on click', function() {
    const photo = { id: 1, path: '/p.png', replace_in_progress: false };
    const { replace, del } = buttons(photo, handlers);

    replace.props.onClick();
    del.props.onClick();

    expect(handlers.onReplace).toHaveBeenCalledWith(photo);
    expect(handlers.onDelete).toHaveBeenCalledWith(photo);
  });

  it('disables both buttons while a replace is in progress', function() {
    const { replace, del } = buttons({ id: 1, path: '/p.png', replace_in_progress: true }, handlers);

    expect(replace.props.disabled).toBe(true);
    expect(del.props.disabled).toBe(true);
  });

  it('disables only Replace when the photo has no path', function() {
    const { replace, del } = buttons({ id: 1, path: '', replace_in_progress: false }, handlers);

    expect(replace.props.disabled).toBe(true);
    expect(del.props.disabled).toBe(false);
  });
});
