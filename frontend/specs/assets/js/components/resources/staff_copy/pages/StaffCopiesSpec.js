import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffCopies from '../../../../../../../assets/js/components/resources/staff_copy/pages/StaffCopies.jsx';
import StaffCopiesController from '../../../../../../../assets/js/components/resources/staff_copy/pages/controllers/StaffCopiesController.js';
import Translator from '../../../../../../../assets/js/i18n/Translator.js';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

describe('StaffCopies', function() {
  it('renders the loading state before the effect loads anything', function() {
    stubBuildEffect(StaffCopiesController);

    const html = renderToStaticMarkup(React.createElement(StaffCopies));

    expect(html).toContain(Translator.t('staff_copies_page.loading'));
  });
});
