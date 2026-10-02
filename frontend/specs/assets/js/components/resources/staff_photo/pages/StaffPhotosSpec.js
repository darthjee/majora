import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffPhotos from '../../../../../../../assets/js/components/resources/staff_photo/pages/StaffPhotos.jsx';
import StaffPhotosController from '../../../../../../../assets/js/components/resources/staff_photo/pages/controllers/StaffPhotosController.js';
import Translator from '../../../../../../../assets/js/i18n/Translator.js';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

describe('StaffPhotos', function() {
  it('renders the loading state before the effect loads anything', function() {
    stubBuildEffect(StaffPhotosController);

    const html = renderToStaticMarkup(React.createElement(StaffPhotos));

    expect(html).toContain(Translator.t('staff_photos_page.loading'));
  });
});
