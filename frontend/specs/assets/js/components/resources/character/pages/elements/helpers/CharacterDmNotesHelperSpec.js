import { renderToStaticMarkup } from 'react-dom/server';
import CharacterDmNotesHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/CharacterDmNotesHelper.jsx';

describe('CharacterDmNotesHelper', function() {
  describe('.render', function() {
    it('renders the private description when present', function() {
      const html = renderToStaticMarkup(CharacterDmNotesHelper.render('Secret DM notes.'));
      expect(html).toContain('Secret DM notes.');
      expect(html).toContain('DM Notes');
    });

    it('renders the description with the text-pre-wrap class to preserve line breaks', function() {
      const html = renderToStaticMarkup(CharacterDmNotesHelper.render('Line one.\nLine two.'));
      expect(html).toContain('text-pre-wrap');
      expect(html).toContain('Line one.\nLine two.');
    });

    it('returns null when private_description is absent', function() {
      expect(CharacterDmNotesHelper.render()).toBeNull();
    });

    it('returns null when private_description is empty', function() {
      expect(CharacterDmNotesHelper.render('')).toBeNull();
    });
  });
});
