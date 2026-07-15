import { renderToStaticMarkup } from 'react-dom/server';
import CharacterMoneyHelper from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyHelper.jsx';

describe('CharacterMoneyHelper', function() {
  describe('.render', function() {
    it('renders each non-zero denomination joined with a pipe', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(332, 'dnd'));
      expect(html).toContain('22 CP | 21 SP | 1 GP');
    });

    it('renders platinum entries', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(30, 'dnd'));
      expect(html).toContain('20 CP | 1 SP');
    });

    it('lets platinum absorb all remaining value instead of a gems entry', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(32221, 'dnd'));
      expect(html).toContain('21 CP | 20 SP | 20 GP | 30 PP');
    });

    it('absorbs the remainder into platinum for 42219', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(42219, 'dnd'));
      expect(html).toContain('29 CP | 29 SP | 29 GP | 39 PP');
    });

    it('absorbs the remainder into platinum for 33219', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(33219, 'dnd'));
      expect(html).toContain('29 CP | 29 SP | 29 GP | 30 PP');
    });

    it('returns null when money is 0', function() {
      expect(CharacterMoneyHelper.render(0, 'dnd')).toBeNull();
    });

    it('renders a deadlands cents/dollars breakdown', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(350, 'deadlands'));
      expect(html).toContain('50 Cents | 3 Dollars');
    });

    it('returns null for deadlands when money is 0', function() {
      expect(CharacterMoneyHelper.render(0, 'deadlands')).toBeNull();
    });
  });
});
