import { renderToStaticMarkup } from 'react-dom/server';
import BackButtonHelper from '../../../../../../../assets/js/components/common/buttons/helpers/BackButtonHelper.jsx';

describe('BackButtonHelper', function() {
  describe('.render', function() {
    it('renders a link to the provided href', function() {
      const html = renderToStaticMarkup(BackButtonHelper.render('#/games/demo'));
      expect(html).toContain('href="#/games/demo"');
    });

    it('renders the back label', function() {
      const html = renderToStaticMarkup(BackButtonHelper.render('#/games/demo'));
      expect(html).toContain('Back');
    });

    it('applies button styling classes', function() {
      const html = renderToStaticMarkup(BackButtonHelper.render('#/games/demo'));
      expect(html).toContain('btn');
    });
  });
});
