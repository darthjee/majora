import { renderToStaticMarkup } from 'react-dom/server';
import CharacterDescriptionHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/CharacterDescriptionHelper.jsx';

describe('CharacterDescriptionHelper', function() {
  describe('.render', function() {
    it('renders description when present', function() {
      const html = renderToStaticMarkup(CharacterDescriptionHelper.render('The future king.'));
      expect(html).toContain('The future king.');
      expect(html).toContain('border');
    });

    it('preserves line breaks via remark-breaks', function() {
      const html = renderToStaticMarkup(CharacterDescriptionHelper.render('Line one.\nLine two.'));
      expect(html).toContain('Line one.<br');
      expect(html).toContain('Line two.');
    });

    it('renders nothing when description is absent', function() {
      const html = renderToStaticMarkup(CharacterDescriptionHelper.render());
      expect(html).toBe('');
    });

    it('renders nothing when description is empty', function() {
      const html = renderToStaticMarkup(CharacterDescriptionHelper.render(''));
      expect(html).toBe('');
    });
  });
});
