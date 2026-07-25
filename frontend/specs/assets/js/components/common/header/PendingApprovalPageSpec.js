import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PendingApprovalPage from '../../../../../../assets/js/components/common/header/PendingApprovalPage.jsx';
import Translator from '../../../../../../assets/js/i18n/Translator.js';

describe('PendingApprovalPage', function() {
  it('renders the awaiting-approval title and body', function() {
    const html = renderToStaticMarkup(React.createElement(PendingApprovalPage));

    expect(html).toContain(Translator.t('pending_approval_page.title'));
    expect(html).toContain(Translator.t('pending_approval_page.body'));
  });
});
