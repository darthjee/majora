import { renderToStaticMarkup } from 'react-dom/server';
import GamePollHelper
  from '../../../../../../../../assets/js/components/resources/game/pages/helpers/GamePollHelper.jsx';

describe('GamePollHelper', function() {
  describe('.render', function() {
    const poll = {
      id: 1,
      title: 'Which tavern?',
      description: 'Pick one for tonight.',
      type: 'single',
      status: 'open',
      game_slug: 'demo',
      options: [{ id: 10, option: 'The Drunken Griffin' }, { id: 11, option: 'The Rusty Anchor' }],
    };

    it('renders the poll title, description, type, and status', function() {
      const html = renderToStaticMarkup(GamePollHelper.render(poll));

      expect(html).toContain('Which tavern?');
      expect(html).toContain('Pick one for tonight.');
    });

    it('renders each option', function() {
      const html = renderToStaticMarkup(GamePollHelper.render(poll));

      expect(html).toContain('The Drunken Griffin');
      expect(html).toContain('The Rusty Anchor');
    });

    it('renders a back link to the polls list', function() {
      const html = renderToStaticMarkup(GamePollHelper.render(poll));
      expect(html).toContain('href="#/games/demo/polls"');
    });

    it('renders without options when the poll has none', function() {
      const html = renderToStaticMarkup(GamePollHelper.render({ ...poll, options: [] }));
      expect(html).toContain('Which tavern?');
    });

    it('renders without a description when the poll has none', function() {
      const html = renderToStaticMarkup(GamePollHelper.render({ ...poll, description: '' }));
      expect(html).not.toContain('Pick one for tonight.');
    });

    it('renders text-type option values unchanged', function() {
      const html = renderToStaticMarkup(GamePollHelper.render({ ...poll, option_type: 'text' }));

      expect(html).toContain('The Drunken Griffin');
      expect(html).toContain('The Rusty Anchor');
    });

    it('renders date-type option values formatted as dates', function() {
      const datePoll = {
        ...poll,
        option_type: 'date',
        options: [{ id: 10, option: '2026-08-01' }, { id: 11, option: '2026-01-01' }],
      };

      const html = renderToStaticMarkup(GamePollHelper.render(datePoll));

      expect(html).not.toContain('2026-08-01');
      expect(html).not.toContain('2026-01-01');
      expect(html).toContain(new Date(2026, 7, 1).toLocaleDateString('en'));
      expect(html).toContain(new Date(2026, 0, 1).toLocaleDateString('en'));
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(GamePollHelper.renderLoading());
      expect(html).toContain('Loading poll...');
    });
  });

  describe('.renderError', function() {
    it('renders the error alert', function() {
      const html = renderToStaticMarkup(GamePollHelper.renderError('Unable to load poll.'));
      expect(html).toContain('Unable to load poll.');
    });
  });
});
