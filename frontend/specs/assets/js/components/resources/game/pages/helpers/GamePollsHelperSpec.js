import { renderToStaticMarkup } from 'react-dom/server';
import GamePollsHelper
  from '../../../../../../../../assets/js/components/resources/game/pages/helpers/GamePollsHelper.jsx';

describe('GamePollsHelper', function() {
  const pagination = { page: 1, pages: 1, perPage: 10 };

  describe('.render', function() {
    it('renders each poll as a link to its detail page, with its status', function() {
      const html = renderToStaticMarkup(GamePollsHelper.render({
        polls: [{ id: 1, title: 'Which tavern?', type: 'single', status: 'open' }],
        pagination,
        gameSlug: 'demo',
        basePath: '#/games/demo/polls',
        backHref: '#/games/demo',
        newHref: '#/games/demo/polls/new',
      }));

      expect(html).toContain('href="#/games/demo/polls/1"');
      expect(html).toContain('Which tavern?');
    });

    it('renders an empty state when there are no polls', function() {
      const html = renderToStaticMarkup(GamePollsHelper.render({
        polls: [],
        pagination,
        gameSlug: 'demo',
        basePath: '#/games/demo/polls',
        backHref: '#/games/demo',
        newHref: '#/games/demo/polls/new',
      }));

      expect(html).toContain('No polls yet.');
    });

    it('renders a New Poll button linking to the new poll form', function() {
      const html = renderToStaticMarkup(GamePollsHelper.render({
        polls: [],
        pagination,
        gameSlug: 'demo',
        basePath: '#/games/demo/polls',
        backHref: '#/games/demo',
        newHref: '#/games/demo/polls/new',
      }));

      expect(html).toContain('href="#/games/demo/polls/new"');
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(GamePollsHelper.renderLoading());
      expect(html).toContain('Loading polls...');
    });
  });

  describe('.renderError', function() {
    it('renders the error alert', function() {
      const html = renderToStaticMarkup(GamePollsHelper.renderError('Unable to load polls.'));
      expect(html).toContain('Unable to load polls.');
    });
  });
});
