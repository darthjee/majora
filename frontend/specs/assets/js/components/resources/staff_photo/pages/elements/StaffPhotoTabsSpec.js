import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffPhotoTabs from '../../../../../../../../assets/js/components/resources/staff_photo/pages/elements/StaffPhotoTabs.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffPhotoTabs', function() {
  it('renders one tab link per type, marking the active one', function() {
    const html = renderToStaticMarkup(
      React.createElement(StaffPhotoTabs, { types: ['game', 'stl_model'], activeType: 'stl_model' }),
    );

    expect(html).toContain('nav nav-tabs flex-wrap mb-3');
    expect(html).toContain('<a class="nav-link" href="#/staff/photos?type=game">');
    expect(html).toContain('<a class="nav-link active" aria-current="page" href="#/staff/photos?type=stl_model">');
    expect(html).toContain(Translator.t('staff_photos_page.types.game'));
    expect(html).toContain(Translator.t('staff_photos_page.types.stl_model'));
  });

  it('renders an empty tab bar without types', function() {
    const html = renderToStaticMarkup(React.createElement(StaffPhotoTabs, { types: [], activeType: null }));

    expect(html).not.toContain('nav-item');
  });
});
