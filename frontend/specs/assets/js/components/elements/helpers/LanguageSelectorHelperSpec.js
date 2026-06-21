import { renderToStaticMarkup } from 'react-dom/server';
import LanguageSelectorHelper from '../../../../../../assets/js/components/elements/helpers/LanguageSelectorHelper.jsx';

describe('LanguageSelectorHelper', function() {
  describe('.render', function() {
    it('renders an option for every entry in state.options', function() {
      const html = renderToStaticMarkup(
        LanguageSelectorHelper.render(
          { language: 'en', options: [{ code: 'en', flag: '🇬🇧' }] },
          { onChange: () => {} }
        )
      );

      expect(html).toContain('data-testid="language-selector"');
      expect(html).toContain('value="en"');
      expect(html).toContain('🇬🇧 en');
    });
  });
});
