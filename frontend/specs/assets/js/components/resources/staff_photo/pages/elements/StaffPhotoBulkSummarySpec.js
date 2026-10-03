import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffPhotoBulkSummary from '../../../../../../../../assets/js/components/resources/staff_photo/pages/elements/StaffPhotoBulkSummary.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffPhotoBulkSummary', function() {
  const outcomes = [
    { photo: { id: 1, owner: null }, status: 'done' },
    { photo: { id: 2, owner: null }, status: 'skipped', reason: 'staff_photos_page.skip_already_small' },
    { photo: { id: 3, owner: null }, status: 'failed', reason: 'staff_photos_page.error_generic' },
  ];

  /**
   * @description Renders the summary to static markup.
   * @param {object} result - Bulk result.
   * @returns {string} The markup.
   */
  function render(result) {
    return renderToStaticMarkup(React.createElement(StaffPhotoBulkSummary, { result, onClose: () => null }));
  }

  it('renders nothing without a result', function() {
    expect(StaffPhotoBulkSummary({ result: null, onClose: () => null })).toBeNull();
  });

  it('groups a resize result into resized, skipped and failed', function() {
    const html = render({ action: 'resize', outcomes });

    expect(html).toContain(Translator.t('staff_photos_page.summary_title'));
    expect(html).toContain(`${Translator.t('staff_photos_page.summary_resized')} (1)`);
    expect(html).toContain(`${Translator.t('staff_photos_page.summary_skipped')} (1)`);
    expect(html).toContain(`${Translator.t('staff_photos_page.summary_failed')} (1)`);
    expect(html).toContain(Translator.t('staff_photos_page.skip_already_small'));
    expect(html).toContain(Translator.t('staff_photos_page.error_generic'));
    expect(html).not.toContain(Translator.t('staff_photos_page.summary_deleted'));
  });

  it('labels the done group as deleted for a delete result', function() {
    const html = render({ action: 'delete', outcomes: [outcomes[0]] });

    expect(html).toContain(`${Translator.t('staff_photos_page.summary_deleted')} (1)`);
    expect(html).not.toContain(Translator.t('staff_photos_page.summary_skipped'));
  });

  it('calls onClose from the close button', function() {
    const onClose = jasmine.createSpy('onClose');
    const card = StaffPhotoBulkSummary({ result: { action: 'resize', outcomes }, onClose });
    const children = card.props.children.props.children;
    const button = children[children.length - 1];

    expect(button.props.children).toBe(Translator.t('staff_photos_page.summary_close'));
    button.props.onClick();

    expect(onClose).toHaveBeenCalled();
  });
});
