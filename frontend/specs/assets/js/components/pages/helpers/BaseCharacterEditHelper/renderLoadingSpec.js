import { renderToStaticMarkup } from 'react-dom/server';
import { helper } from './support.js';

describe('BaseCharacterEditHelper', function() {
  describe('#renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(helper.renderLoading())).toContain('Loading character');
    });
  });
});
