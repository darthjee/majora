import { renderToStaticMarkup } from 'react-dom/server';
import LanguageSelectorHelper from '../../../../../../../assets/js/components/common/misc/helpers/LanguageSelectorHelper.jsx';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

describe('LanguageSelectorHelper', function() {
  describe('.render', function() {
    it('renders an option for every entry in state.options', function() {
      const html = renderToStaticMarkup(
        LanguageSelectorHelper.render(
          { language: 'en', options: [{ code: 'en', flag: '🇬🇧' }] },
          { onChange: Noop.noop }
        )
      );

      expect(html).toContain('data-testid="language-selector"');
      expect(html).toContain('value="en"');
      expect(html).toContain('🇬🇧 en');
    });
  });
});
