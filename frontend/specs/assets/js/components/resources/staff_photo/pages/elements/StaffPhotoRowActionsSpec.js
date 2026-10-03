import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffPhotoRowActions from '../../../../../../../../assets/js/components/resources/staff_photo/pages/elements/StaffPhotoRowActions.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

/**
 * @description Builds the row actions element tree by calling the component directly.
 * @param {object} photo - Photo row.
 * @param {object} handlers - onResize/onReplace/onDelete spies.
 * @param {boolean} [disabled] - Bulk running flag.
 * @returns {{resize: object, replace: object, del: object}} The three button elements.
 */
function buttons(photo, handlers, disabled) {
  const [resize, replace, del] = StaffPhotoRowActions({ photo, disabled, ...handlers }).props.children;

  return { resize, replace, del };
}

describe('StaffPhotoRowActions', function() {
  let handlers;
  const regular = {
    id: 1, path: '/p.png', ready: true, replace_in_progress: false,
  };

  beforeEach(function() {
    handlers = {
      onResize: jasmine.createSpy('onResize'),
      onReplace: jasmine.createSpy('onReplace'),
      onDelete: jasmine.createSpy('onDelete'),
    };
  });

  it('renders enabled Resize, Replace and Delete buttons for a regular photo', function() {
    const html = renderToStaticMarkup(React.createElement(StaffPhotoRowActions, { photo: regular, ...handlers }));
    const { resize, replace, del } = buttons(regular, handlers);

    expect(html).toContain(Translator.t('staff_photos_page.resize'));
    expect(html).toContain(Translator.t('staff_photos_page.replace'));
    expect(html).toContain(Translator.t('staff_photos_page.delete'));
    expect(resize.props.disabled).toBe(false);
    expect(replace.props.disabled).toBe(false);
    expect(del.props.disabled).toBe(false);
  });

  it('passes the photo to the handlers on click', function() {
    const { resize, replace, del } = buttons(regular, handlers);

    resize.props.onClick();
    replace.props.onClick();
    del.props.onClick();

    expect(handlers.onResize).toHaveBeenCalledWith(regular);
    expect(handlers.onReplace).toHaveBeenCalledWith(regular);
    expect(handlers.onDelete).toHaveBeenCalledWith(regular);
  });

  it('disables every button while a replace is in progress', function() {
    const { resize, replace, del } = buttons({ ...regular, replace_in_progress: true }, handlers);

    expect(resize.props.disabled).toBe(true);
    expect(replace.props.disabled).toBe(true);
    expect(del.props.disabled).toBe(true);
  });

  it('disables Resize and Replace when the photo has no path', function() {
    const { resize, replace, del } = buttons({ ...regular, path: '' }, handlers);

    expect(resize.props.disabled).toBe(true);
    expect(replace.props.disabled).toBe(true);
    expect(del.props.disabled).toBe(false);
  });

  it('disables only Resize when the photo is not ready', function() {
    const { resize, replace, del } = buttons({ ...regular, ready: false }, handlers);

    expect(resize.props.disabled).toBe(true);
    expect(replace.props.disabled).toBe(false);
    expect(del.props.disabled).toBe(false);
  });

  it('disables every button while a bulk job runs', function() {
    const { resize, replace, del } = buttons(regular, handlers, true);

    expect(resize.props.disabled).toBe(true);
    expect(replace.props.disabled).toBe(true);
    expect(del.props.disabled).toBe(true);
  });
});
