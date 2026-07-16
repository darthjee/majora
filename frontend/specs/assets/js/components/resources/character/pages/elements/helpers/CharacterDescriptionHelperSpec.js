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

    it('renders the description with the text-pre-wrap class to preserve line breaks', function() {
      const html = renderToStaticMarkup(CharacterDescriptionHelper.render('Line one.\nLine two.'));
      expect(html).toContain('text-pre-wrap');
      expect(html).toContain('Line one.\nLine two.');
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
