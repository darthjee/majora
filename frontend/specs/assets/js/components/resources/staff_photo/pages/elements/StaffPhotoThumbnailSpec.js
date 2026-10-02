import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffPhotoThumbnail from '../../../../../../../../assets/js/components/resources/staff_photo/pages/elements/StaffPhotoThumbnail.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffPhotoThumbnail', function() {
  it('renders the image with its versioned src', function() {
    const html = renderToStaticMarkup(React.createElement(StaffPhotoThumbnail, {
      photo: { id: 1, path: '/photos/game/1.png' }, versions: { 1: 99 },
    }));

    expect(html).toContain('src="/photos/game/1.png?v=99"');
  });

  it('renders the image without versions', function() {
    const html = renderToStaticMarkup(React.createElement(StaffPhotoThumbnail, {
      photo: { id: 1, path: '/photos/game/1.png' },
    }));

    expect(html).toContain('src="/photos/game/1.png"');
  });

  it('renders the placeholder when the photo has no path', function() {
    const html = renderToStaticMarkup(React.createElement(StaffPhotoThumbnail, {
      photo: { id: 1, path: '' },
    }));

    expect(html).not.toContain('<img');
    expect(html).toContain(Translator.t('staff_photos_page.broken_image_alt'));
  });
});
