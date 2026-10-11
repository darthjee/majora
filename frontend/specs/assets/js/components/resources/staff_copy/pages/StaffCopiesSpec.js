import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffCopies from '../../../../../../../assets/js/components/resources/staff_copy/pages/StaffCopies.jsx';
import Translator from '../../../../../../../assets/js/i18n/Translator.js';

describe('StaffCopies', function() {
  it('renders the loading state before the effect loads anything', function() {
    const html = renderToStaticMarkup(React.createElement(StaffCopies));

    expect(html).toContain(Translator.t('staff_copies_page.loading'));
  });
});
