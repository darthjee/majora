import { renderToStaticMarkup } from 'react-dom/server';
import GamePollHelper
  from '../../../../../../../../../assets/js/components/resources/game/pages/helpers/GamePollHelper.jsx';

describe('GamePollHelper', function() {
  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(GamePollHelper.renderLoading());
      expect(html).toContain('Loading poll...');
    });
  });
});
