import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffCopyProgress from '../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/StaffCopyProgress.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

const render = (run) => renderToStaticMarkup(React.createElement(StaffCopyProgress, { run }));

describe('StaffCopyProgress', function() {
  it('renders nothing without a run', function() {
    expect(render(null)).toBe('');
  });

  it('renders the counter, the bar and the per-entity results', function() {
    const html = render({
      running: true,
      total: 2,
      done: 1,
      entities: [
        {
          id: 1, name: 'Sword', status: 'copied', reason: null,
          links: [{ upload_id: 9, upload_type: 'image', status: 'linked' }],
        },
        {
          id: 2, name: 'Shield', status: 'failed', reason: 'staff_copies_page.entity_error.name_taken', links: [],
        },
      ],
    });

    expect(html).toContain(Translator.t('staff_copies_page.progress').replace('{{done}}', 1).replace('{{total}}', 2));
    expect(html).toContain('width:50%');
    expect(html).toContain('Sword');
    expect(html).toContain(Translator.t('staff_copies_page.entity_status.copied'));
    expect(html).toContain(Translator.t('staff_copies_page.link_kind.image'));
    expect(html).toContain(Translator.t('staff_copies_page.link_status.linked'));
    expect(html).toContain(Translator.t('staff_copies_page.entity_status.failed'));
    expect(html).toContain(Translator.t('staff_copies_page.entity_error.name_taken'));
  });

  it('renders a full bar for an empty run', function() {
    expect(render({ total: 0, done: 0, entities: [] })).toContain('width:100%');
  });
});
