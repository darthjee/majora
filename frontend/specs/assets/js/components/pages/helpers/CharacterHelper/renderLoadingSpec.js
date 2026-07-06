import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../../assets/js/components/pages/helpers/CharacterHelper.jsx';

describe('CharacterHelper', function() {
  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(CharacterHelper.renderLoading())).toContain('Loading character');
    });
  });
});
