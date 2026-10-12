import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffCopyTabs from '../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/StaffCopyTabs.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffCopyTabs', function() {
  it('renders one link per type keeping from/to and marks the active one', function() {
    const html = renderToStaticMarkup(React.createElement(StaffCopyTabs, {
      types: ['items', 'factions'],
      selection: { type: 'factions', from: 'a', to: 'b' },
    }));

    expect(html).toContain('href="#/staff/copies?type=items&amp;from=a&amp;to=b"');
    expect(html).toContain('class="nav-link active" aria-current="page" href="#/staff/copies?type=factions&amp;from=a&amp;to=b"');
    expect(html).toContain(Translator.t('staff_copies_page.types.items'));
    expect(html).toContain(Translator.t('staff_copies_page.types.factions'));
  });

  it('omits empty params from the links', function() {
    const html = renderToStaticMarkup(React.createElement(StaffCopyTabs, {
      types: ['items'],
      selection: { type: 'items', from: '', to: 'b' },
    }));

    expect(html).toContain('href="#/staff/copies?type=items&amp;to=b"');
  });

  it('falls back to the raw slug when the label key is missing', function() {
    const html = renderToStaticMarkup(React.createElement(StaffCopyTabs, {
      types: ['mystery_type'],
      selection: { type: '', from: '', to: '' },
    }));

    expect(html).toContain('>mystery_type</a>');
  });
});
