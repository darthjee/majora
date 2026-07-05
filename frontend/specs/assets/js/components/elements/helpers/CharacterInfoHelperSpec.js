import { renderToStaticMarkup } from 'react-dom/server';
import CharacterInfoHelper from '../../../../../../assets/js/components/elements/helpers/CharacterInfoHelper.jsx';

describe('CharacterInfoHelper', function() {
  describe('.render', function() {
    it('renders the role when present', function() {
      const html = renderToStaticMarkup(CharacterInfoHelper.render('Ranger', ''));
      expect(html).toContain('Ranger');
    });

    it('does not render role section when role is absent', function() {
      expect(renderToStaticMarkup(CharacterInfoHelper.render()))
        .not.toContain('Role:');
    });

    it('renders description when present', function() {
      const html = renderToStaticMarkup(CharacterInfoHelper.render('', 'The future king.'));
      expect(html).toContain('The future king.');
      expect(html).toContain('border');
    });

    it('renders the description with the text-pre-wrap class to preserve line breaks', function() {
      const html = renderToStaticMarkup(CharacterInfoHelper.render('', 'Line one.\nLine two.'));
      expect(html).toContain('text-pre-wrap');
      expect(html).toContain('Line one.\nLine two.');
    });

    it('does not render description when empty', function() {
      expect(renderToStaticMarkup(CharacterInfoHelper.render('', '')))
        .not.toContain('mt-3');
    });
  });
});
