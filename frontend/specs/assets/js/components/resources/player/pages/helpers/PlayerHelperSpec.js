import { renderToStaticMarkup } from 'react-dom/server';
import PlayerHelper
  from '../../../../../../../../assets/js/components/resources/player/pages/helpers/PlayerHelper.jsx';

const conversationsState = (overrides = {}) => ({
  basePath: '#/games/demo/players/7',
  pageParam: 'conv_page',
  conversations: [],
  pagination: { page: 1, pages: 1, perPage: 10 },
  loading: false,
  error: '',
  ...overrides,
});

describe('PlayerHelper', function() {
  describe('.render', function() {
    it('renders the character card with the character name', function() {
      const player = { character: { name: 'Frodo', photo_url: '/char.png' }, user: null };
      const html = renderToStaticMarkup(PlayerHelper.render(player, '#/games/demo/players', conversationsState()));

      expect(html).toContain('Frodo');
      expect(html).toContain('/char.png');
    });

    it('renders the user card with the linked account display name', function() {
      const player = { character: null, user: { display_name: 'Alice', photo_url: '/user.png' } };
      const html = renderToStaticMarkup(PlayerHelper.render(player, '#/games/demo/players', conversationsState()));

      expect(html).toContain('Alice');
      expect(html).toContain('/user.png');
    });

    it('renders a placeholder when the player has no character (e.g. the DM)', function() {
      const player = { character: null, user: { display_name: 'Alice', photo_url: '/user.png' } };
      const html = renderToStaticMarkup(PlayerHelper.render(player, '#/games/demo/players', conversationsState()));

      expect(html).toContain('No character');
    });

    it('renders a placeholder when the player has no linked account', function() {
      const player = { character: { name: 'Frodo', photo_url: '/char.png' }, user: null };
      const html = renderToStaticMarkup(PlayerHelper.render(player, '#/games/demo/players', conversationsState()));

      expect(html).toContain('No linked account');
    });

    it('renders a back button to the players roster page', function() {
      const player = { character: null, user: null };
      const html = renderToStaticMarkup(PlayerHelper.render(player, '#/games/demo/players', conversationsState()));

      expect(html).toContain('href="#/games/demo/players"');
    });

    it('renders the conversations empty state', function() {
      const player = { character: null, user: null };
      const html = renderToStaticMarkup(PlayerHelper.render(player, '#/games/demo/players', conversationsState()));

      expect(html).toContain('No shared conversations yet.');
    });

    it('renders the loaded conversations list', function() {
      const player = { character: null, user: null };
      const state = conversationsState({ conversations: [{ id: 1, title: 'Session recap' }] });
      const html = renderToStaticMarkup(PlayerHelper.render(player, '#/games/demo/players', state));

      expect(html).toContain('Session recap');
    });

    it('renders the conversations loading state', function() {
      const player = { character: null, user: null };
      const state = conversationsState({ loading: true });
      const html = renderToStaticMarkup(PlayerHelper.render(player, '#/games/demo/players', state));

      expect(html).toContain('Loading conversations...');
    });

    it('renders the conversations error state', function() {
      const player = { character: null, user: null };
      const state = conversationsState({ error: 'Unable to load conversations.' });
      const html = renderToStaticMarkup(PlayerHelper.render(player, '#/games/demo/players', state));

      expect(html).toContain('Unable to load conversations.');
    });

    it('renders the conversations pagination with the given basePath/pageParam', function() {
      const player = { character: null, user: null };
      const state = conversationsState({
        basePath: '#/games/demo/players/7', pageParam: 'conv_page', pagination: { page: 1, pages: 3, perPage: 10 },
      });
      const html = renderToStaticMarkup(PlayerHelper.render(player, '#/games/demo/players', state));

      expect(html).toContain('conv_page=2');
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(PlayerHelper.renderLoading());
      expect(html).toContain('Loading player...');
    });
  });

  describe('.renderError', function() {
    it('renders the error message', function() {
      const html = renderToStaticMarkup(PlayerHelper.renderError('boom'));
      expect(html).toContain('boom');
    });
  });
});
