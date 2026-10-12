import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffCopyHiddenBadge from '../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/StaffCopyHiddenBadge.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffCopyHiddenBadge', function() {
  it('renders the badge when hidden', function() {
    const html = renderToStaticMarkup(React.createElement(StaffCopyHiddenBadge, { hidden: true }));

    expect(html).toContain('badge text-bg-secondary');
    expect(html).toContain(Translator.t('staff_copies_page.hidden_badge'));
  });

  it('renders nothing when not hidden', function() {
    expect(renderToStaticMarkup(React.createElement(StaffCopyHiddenBadge, { hidden: false }))).toBe('');
  });
});
