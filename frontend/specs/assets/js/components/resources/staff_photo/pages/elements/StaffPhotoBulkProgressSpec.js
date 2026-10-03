import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffPhotoBulkProgress from '../../../../../../../../assets/js/components/resources/staff_photo/pages/elements/StaffPhotoBulkProgress.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffPhotoBulkProgress', function() {
  it('renders nothing without a job', function() {
    expect(StaffPhotoBulkProgress({ job: null })).toBeNull();
  });

  it('renders the progress label and bar', function() {
    const html = renderToStaticMarkup(React.createElement(StaffPhotoBulkProgress, {
      job: { action: 'resize', total: 4, done: 1 },
    }));

    expect(html).toContain(Translator.t('staff_photos_page.bulk_progress')
      .replace('{{done}}', 1).replace('{{total}}', 4));
    expect(html).toContain('width:25%');
    expect(html).toContain('aria-valuenow="1"');
    expect(html).toContain('aria-valuemax="4"');
  });

  it('renders a full bar for an empty job', function() {
    const html = renderToStaticMarkup(React.createElement(StaffPhotoBulkProgress, {
      job: { action: 'delete', total: 0, done: 0 },
    }));

    expect(html).toContain('width:100%');
  });
});
