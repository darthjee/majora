import { renderToStaticMarkup } from 'react-dom/server';
import GamePollHelper
  from '../../../../../../../../assets/js/components/resources/game/pages/helpers/GamePollHelper.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

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

    it('renders a read-only options list without vote controls when the poll is not open', function() {
      const html = renderToStaticMarkup(GamePollHelper.render(
        { ...poll, status: 'closed' },
        { canVote: true, selectedOptionIds: [], voteStatus: 'idle' },
        { onToggleOption: Noop.noop, onSubmit: Noop.noop },
      ));

      expect(html).not.toContain('type="radio"');
      expect(html).not.toContain('type="checkbox"');
      expect(html).not.toContain('type="submit"');
    });

    it('renders a radio input per option for a single-type open poll', function() {
      const html = renderToStaticMarkup(GamePollHelper.render(
        poll,
        { canVote: true, selectedOptionIds: [], voteStatus: 'idle' },
        { onToggleOption: Noop.noop, onSubmit: Noop.noop },
      ));

      expect(html).toContain('type="radio"');
      expect(html).not.toContain('type="checkbox"');
    });

    it('renders a checkbox input per option for a multiple-type open poll', function() {
      const html = renderToStaticMarkup(GamePollHelper.render(
        { ...poll, type: 'multiple' },
        { canVote: true, selectedOptionIds: [], voteStatus: 'idle' },
        { onToggleOption: Noop.noop, onSubmit: Noop.noop },
      ));

      expect(html).toContain('type="checkbox"');
      expect(html).not.toContain('type="radio"');
    });

    it('renders the singular cast-vote label for a single-type poll', function() {
      const html = renderToStaticMarkup(GamePollHelper.render(
        poll,
        { canVote: true, selectedOptionIds: [], voteStatus: 'idle' },
        { onToggleOption: Noop.noop, onSubmit: Noop.noop },
      ));

      expect(html).toContain('Cast Vote<');
    });

    it('renders the plural cast-votes label for a multiple-type poll', function() {
      const html = renderToStaticMarkup(GamePollHelper.render(
        { ...poll, type: 'multiple' },
        { canVote: true, selectedOptionIds: [], voteStatus: 'idle' },
        { onToggleOption: Noop.noop, onSubmit: Noop.noop },
      ));

      expect(html).toContain('Cast Votes<');
    });

    it('pre-selects the options in selectedOptionIds', function() {
      const html = renderToStaticMarkup(GamePollHelper.render(
        poll,
        { canVote: true, selectedOptionIds: [10], voteStatus: 'idle' },
        { onToggleOption: Noop.noop, onSubmit: Noop.noop },
      ));

      const checkedOptionMatch = html.match(/id="game-poll-option-10"[^>]*checked=""/);
      expect(checkedOptionMatch).not.toBeNull();
    });

    it('renders the vote controls and submit button disabled when the viewer cannot vote', function() {
      const html = renderToStaticMarkup(GamePollHelper.render(
        poll,
        { canVote: false, selectedOptionIds: [], voteStatus: 'idle' },
        { onToggleOption: Noop.noop, onSubmit: Noop.noop },
      ));

      expect(html).toContain('type="radio"');
      expect(html).toContain('disabled=""');
    });

    it('renders the vote error message after a failed submission', function() {
      const html = renderToStaticMarkup(GamePollHelper.render(
        poll,
        { canVote: true, selectedOptionIds: [], voteStatus: 'error' },
        { onToggleOption: Noop.noop, onSubmit: Noop.noop },
      ));

      expect(html).toContain('Failed to cast vote');
    });

    it('does not render vote controls when the open poll has no options', function() {
      const html = renderToStaticMarkup(GamePollHelper.render(
        { ...poll, options: [] },
        { canVote: true, selectedOptionIds: [], voteStatus: 'idle' },
        { onToggleOption: Noop.noop, onSubmit: Noop.noop },
      ));

      expect(html).not.toContain('type="radio"');
      expect(html).not.toContain('type="submit"');
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
