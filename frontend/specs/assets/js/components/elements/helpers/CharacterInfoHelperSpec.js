import { renderToStaticMarkup } from 'react-dom/server';
import CharacterInfoHelper from '../../../../../../assets/js/components/elements/helpers/CharacterInfoHelper.jsx';

describe('CharacterInfoHelper', function() {
  describe('.render', function() {
    it('renders the character name', function() {
      expect(renderToStaticMarkup(CharacterInfoHelper.render('Aragorn')))
        .toContain('Aragorn');
    });

    it('renders class and level when both are present', function() {
      const html = renderToStaticMarkup(CharacterInfoHelper.render('Aragorn', 'Ranger', 10, ''));
      expect(html).toContain('Ranger');
      expect(html).toContain('10');
    });

    it('renders class without level when level is null', function() {
      const html = renderToStaticMarkup(CharacterInfoHelper.render('Aragorn', 'Ranger', null, ''));
      expect(html).toContain('Ranger');
      expect(html).not.toContain('Level');
    });

    it('renders class without level when level is undefined', function() {
      const html = renderToStaticMarkup(CharacterInfoHelper.render('Aragorn', 'Ranger', undefined, ''));
      expect(html).toContain('Ranger');
      expect(html).not.toContain('Level');
    });

    it('does not render class section when character_class is absent', function() {
      expect(renderToStaticMarkup(CharacterInfoHelper.render('Aragorn')))
        .not.toContain('Class:');
    });

    it('renders description when present', function() {
      const html = renderToStaticMarkup(CharacterInfoHelper.render('Aragorn', '', null, 'The future king.'));
      expect(html).toContain('The future king.');
      expect(html).toContain('border');
    });

    it('does not render description when empty', function() {
      expect(renderToStaticMarkup(CharacterInfoHelper.render('Aragorn', '', null, '')))
        .not.toContain('mt-3');
    });
  });
});
