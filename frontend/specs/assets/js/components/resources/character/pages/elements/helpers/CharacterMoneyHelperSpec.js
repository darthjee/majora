import { renderToStaticMarkup } from 'react-dom/server';
import CharacterMoneyHelper from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyHelper.jsx';

describe('CharacterMoneyHelper', function() {
  describe('.render', function() {
    it('renders each non-zero denomination joined with a pipe', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(332));
      expect(html).toContain('22 CP | 21 SP | 1 GP');
    });

    it('renders platinum entries', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(30));
      expect(html).toContain('20 CP | 1 SP');
    });

    it('renders the gems overflow using the gp_in_gems translation', function() {
      const html = renderToStaticMarkup(CharacterMoneyHelper.render(32221));
      expect(html).toContain('21 CP | 20 SP | 20 GP | 20 PP | 100 GP in gems');
    });

    it('returns null when money is 0', function() {
      expect(CharacterMoneyHelper.render(0)).toBeNull();
    });
  });
});
