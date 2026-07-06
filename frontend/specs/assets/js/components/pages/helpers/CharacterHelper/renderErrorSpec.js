import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../../assets/js/components/pages/helpers/CharacterHelper.jsx';

describe('CharacterHelper', function() {
  describe('.renderError', function() {
    it('renders the error in an alert', function() {
      const html = renderToStaticMarkup(CharacterHelper.renderError('Not found'));
      expect(html).toContain('Not found');
      expect(html).toContain('alert');
    });
  });
});
