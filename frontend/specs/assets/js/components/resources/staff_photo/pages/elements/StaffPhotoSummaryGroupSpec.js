import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffPhotoSummaryGroup from '../../../../../../../../assets/js/components/resources/staff_photo/pages/elements/StaffPhotoSummaryGroup.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffPhotoSummaryGroup', function() {
  it('renders nothing for an empty group', function() {
    expect(StaffPhotoSummaryGroup({ titleKey: 'staff_photos_page.summary_failed', outcomes: [] })).toBeNull();
  });

  it('renders the title with the count and each entry with its owner and reason', function() {
    const html = renderToStaticMarkup(React.createElement(StaffPhotoSummaryGroup, {
      titleKey: 'staff_photos_page.summary_skipped',
      outcomes: [
        {
          photo: {
            id: 7,
            owner: {
              type: 'game', id: 1, name: 'Demo', game: { slug: 'demo', name: 'Demo' },
            },
          },
          reason: 'staff_photos_page.skip_gif',
        },
        { photo: { id: 8, owner: null } },
      ],
    }));

    expect(html).toContain(`${Translator.t('staff_photos_page.summary_skipped')} (2)`);
    expect(html).toContain('#7');
    expect(html).toContain('href="#/games/demo"');
    expect(html).toContain(Translator.t('staff_photos_page.skip_gif'));
    expect(html).toContain('#8');
  });
});
