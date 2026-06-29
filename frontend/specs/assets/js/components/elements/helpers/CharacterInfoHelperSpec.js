import { renderToStaticMarkup } from 'react-dom/server';
import CharacterInfoHelper from '../../../../../../assets/js/components/elements/helpers/CharacterInfoHelper.jsx';

describe('CharacterInfoHelper', function() {
  describe('.render', function() {
    it('renders the character name', function() {
      expect(renderToStaticMarkup(CharacterInfoHelper.render('Aragorn')))
        .toContain('Aragorn');
    });

    it('renders the role when present', function() {
      const html = renderToStaticMarkup(CharacterInfoHelper.render('Aragorn', 'Ranger', ''));
      expect(html).toContain('Ranger');
    });

    it('does not render role section when role is absent', function() {
      expect(renderToStaticMarkup(CharacterInfoHelper.render('Aragorn')))
        .not.toContain('Role:');
    });

    it('renders description when present', function() {
      const html = renderToStaticMarkup(CharacterInfoHelper.render('Aragorn', '', 'The future king.'));
      expect(html).toContain('The future king.');
      expect(html).toContain('border');
    });

    it('does not render description when empty', function() {
      expect(renderToStaticMarkup(CharacterInfoHelper.render('Aragorn', '', '')))
        .not.toContain('mt-3');
    });
  });
});
