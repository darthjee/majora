import { renderToStaticMarkup } from 'react-dom/server';
import GamePollHelper
  from '../../../../../../../../../assets/js/components/resources/game/pages/helpers/GamePollHelper.jsx';

describe('GamePollHelper', function() {
  describe('.renderError', function() {
    it('renders the error alert', function() {
      const html = renderToStaticMarkup(GamePollHelper.renderError('Unable to load poll.'));
      expect(html).toContain('Unable to load poll.');
    });
  });
});
