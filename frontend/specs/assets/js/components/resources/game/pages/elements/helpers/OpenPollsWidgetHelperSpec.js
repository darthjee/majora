import { renderToStaticMarkup } from 'react-dom/server';
import OpenPollsWidgetHelper
  from '../../../../../../../../../assets/js/components/resources/game/pages/elements/helpers/OpenPollsWidgetHelper.jsx';

describe('OpenPollsWidgetHelper', function() {
  describe('.render', function() {
    it('renders a loading placeholder while loading', function() {
      const html = renderToStaticMarkup(
        OpenPollsWidgetHelper.render({ count: 0, loading: true, gameSlug: 'demo' }),
      );

      expect(html).toContain('data-testid="open-polls-loading"');
    });

    it('renders the resolved count and a link to the polls list once loaded', function() {
      const html = renderToStaticMarkup(
        OpenPollsWidgetHelper.render({ count: 3, loading: false, gameSlug: 'demo' }),
      );

      expect(html).not.toContain('data-testid="open-polls-loading"');
      expect(html).toContain('3');
      expect(html).toContain('href="#/games/demo/polls"');
    });
  });
});
