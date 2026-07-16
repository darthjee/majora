import { renderToStaticMarkup } from 'react-dom/server';
import GamePollHelper
  from '../../../../../../../../../assets/js/components/resources/game/pages/helpers/GamePollHelper.jsx';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import { poll } from './support.js';

describe('GamePollHelper', function() {
  describe('.render', function() {
    describe('vote counts and voter avatars', function() {
      const votesPayload = {
        votes_count: [{ option: 10, count: 2 }, { option: 11, count: 0 }],
        users: [
          { id: 1, name: 'alice', avatar_url: 'https://example.com/alice.png' },
          { id: 2, name: 'bob', avatar_url: null },
        ],
        votes: [{ id: 100, option: 10, user_id: 1 }, { id: 101, option: 10, user_id: 2 }],
      };

      it('renders each option\'s vote count, including a zero-vote option, in the read-only list', function() {
        const html = renderToStaticMarkup(GamePollHelper.render(
          { ...poll, status: 'closed' }, undefined, undefined, undefined, votesPayload
        ));

        expect(html).toMatch(/badge bg-secondary ms-2">[^<]*: 2</);
        expect(html).toMatch(/badge bg-secondary ms-2">[^<]*: 0</);
      });

      it('renders an avatar per voter for an option in the read-only list', function() {
        const html = renderToStaticMarkup(GamePollHelper.render(
          { ...poll, status: 'closed' }, undefined, undefined, undefined, votesPayload
        ));

        expect(html).toContain('https://example.com/alice.png');
        expect((html.match(/avatar-photo/g) || []).length).toBe(2);
      });

      it('renders no avatars for a zero-vote option in the read-only list', function() {
        const html = renderToStaticMarkup(GamePollHelper.render(
          { ...poll, status: 'closed', options: [{ id: 11, option: 'The Rusty Anchor' }] },
          undefined, undefined, undefined, votesPayload
        ));

        expect(html).not.toContain('avatar-photo');
      });

      it('renders each option\'s vote count and voter avatars in the votable list', function() {
        const html = renderToStaticMarkup(GamePollHelper.render(
          poll,
          { canVote: true, selectedOptionIds: [], voteStatus: 'idle' },
          { onToggleOption: Noop.noop, onSubmit: Noop.noop },
          undefined,
          votesPayload,
        ));

        expect(html).toMatch(/badge bg-secondary ms-2">[^<]*: 2</);
        expect((html.match(/avatar-photo/g) || []).length).toBe(2);
      });

      it('renders without vote counts/avatars when no votes payload is given', function() {
        const html = renderToStaticMarkup(GamePollHelper.render({ ...poll, status: 'closed' }));

        expect(html).toMatch(/badge bg-secondary ms-2">[^<]*: 0</);
        expect(html).not.toContain('avatar-photo');
      });
    });
  });
});
