import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import LanguageSelector from '../../../../../assets/js/components/common/LanguageSelector.jsx';

describe('LanguageSelector', function() {
  it('renders the available language options', function() {
    const html = renderToStaticMarkup(React.createElement(LanguageSelector));

    expect(html).toContain('data-testid="language-selector"');
    expect(html).toContain('🇬🇧 en');
    expect(html).toContain('🇧🇷 pt');
  });

  it('renders without an onLanguageChange prop', function() {
    expect(() => renderToStaticMarkup(React.createElement(LanguageSelector))).not.toThrow();
  });
});
