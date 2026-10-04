import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffStatisticsPlaceholder
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsPlaceholder.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffStatisticsPlaceholder', function() {
  it('renders the placeholder message', function() {
    const html = renderToStaticMarkup(React.createElement(StaffStatisticsPlaceholder));

    expect(html).toContain('data-testid="statistics-placeholder"');
    expect(html).toContain(Translator.t('staff_statistics_page.placeholder'));
  });
});
