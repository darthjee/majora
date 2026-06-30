import { renderToStaticMarkup } from 'react-dom/server';
import GameHelper from '../../../../../../assets/js/components/pages/helpers/GameHelper.jsx';

describe('GameHelper', function() {
  const game = {
    name: 'Epic Quest',
    game_slug: 'epic-quest',
    photo: null,
    description: 'A heroic adventure.',
  };

  describe('.render', function() {
    it('renders the game name', function() {
      expect(renderToStaticMarkup(GameHelper.render(game))).toContain('Epic Quest');
    });

    it('renders the game description', function() {
      expect(renderToStaticMarkup(GameHelper.render(game))).toContain('A heroic adventure.');
    });

    it('does not render description paragraph when description is empty', function() {
      const gameNoDesc = { ...game, description: '' };
      expect(renderToStaticMarkup(GameHelper.render(gameNoDesc))).not.toContain('<p');
    });

    it('renders a back button to the games page', function() {
      expect(renderToStaticMarkup(GameHelper.render(game))).toContain('href="#/games"');
    });

    it('renders the player characters preview section', function() {
      const pcs = [{ id: 1, name: 'Aragorn', avatar_url: null }];
      const html = renderToStaticMarkup(GameHelper.render(game, pcs));
      expect(html).toContain('Player Characters');
      expect(html).toContain('Aragorn');
      expect(html).toContain('href="#/games/epic-quest/pcs"');
    });

    it('renders the preview section with no characters when pcs is empty', function() {
      const html = renderToStaticMarkup(GameHelper.render(game, []));
      expect(html).toContain('Player Characters');
      expect(html).toContain('href="#/games/epic-quest/pcs"');
    });

    it('renders the preview section when pcs is not provided', function() {
      expect(renderToStaticMarkup(GameHelper.render(game))).toContain('Player Characters');
    });

    it('renders the non-player characters preview section', function() {
      const npcs = [{ id: 2, name: 'Gandalf', avatar_url: null }];
      const html = renderToStaticMarkup(GameHelper.render(game, [], npcs));
      expect(html).toContain('Non-Player Characters');
      expect(html).toContain('Gandalf');
      expect(html).toContain('href="#/games/epic-quest/npcs"');
    });

    it('renders the preview section with no characters when npcs is empty', function() {
      const html = renderToStaticMarkup(GameHelper.render(game, [], []));
      expect(html).toContain('Non-Player Characters');
      expect(html).toContain('href="#/games/epic-quest/npcs"');
    });

    it('renders the npcs preview section when npcs is not provided', function() {
      expect(renderToStaticMarkup(GameHelper.render(game))).toContain('Non-Player Characters');
    });

    it('renders photo URLs when game.photos contains items', function() {
      const gameWithPhotos = { ...game, photos: [{ id: 1, url: 'http://example.com/photo1.jpg' }] };
      const html = renderToStaticMarkup(GameHelper.render(gameWithPhotos));
      expect(html).toContain('http://example.com/photo1.jpg');
    });

    it('renders nothing for photos when game.photos is empty', function() {
      const gameEmptyPhotos = { ...game, photos: [] };
      const html = renderToStaticMarkup(GameHelper.render(gameEmptyPhotos));
      expect(html).not.toContain('img-fluid');
    });

    it('renders nothing for photos when game.photos is undefined', function() {
      const gameNoPhotos = { ...game, photos: undefined };
      const html = renderToStaticMarkup(GameHelper.render(gameNoPhotos));
      expect(html).not.toContain('img-fluid');
    });

    it('renders an edit link when can_edit is true', function() {
      const editableGame = { ...game, can_edit: true };
      const html = renderToStaticMarkup(GameHelper.render(editableGame));
      expect(html).toContain(`href="#/games/${game.game_slug}/edit"`);
    });

    it('does not render an edit link when can_edit is false', function() {
      const nonEditableGame = { ...game, can_edit: false };
      const html = renderToStaticMarkup(GameHelper.render(nonEditableGame));
      expect(html).not.toContain('/edit');
    });

    it('does not render an edit link when can_edit is absent', function() {
      const html = renderToStaticMarkup(GameHelper.render(game));
      expect(html).not.toContain('/edit');
    });

    it('renders the game name in h1 without a button inside', function() {
      const editableGame = { ...game, can_edit: true };
      const html = renderToStaticMarkup(GameHelper.render(editableGame));
      expect(html).toMatch(/<h1>[^<]*Epic Quest[^<]*<\/h1>/);
    });

    it('renders links when game.links contains items', function() {
      const gameWithLinks = {
        ...game,
        links: [
          { text: 'Wiki', url: 'https://example.com/wiki' },
          { text: 'Discord', url: 'https://discord.gg/example' },
        ],
      };
      const html = renderToStaticMarkup(GameHelper.render(gameWithLinks));
      expect(html).toContain('href="https://example.com/wiki"');
      expect(html).toContain('Wiki');
      expect(html).toContain('href="https://discord.gg/example"');
      expect(html).toContain('Discord');
    });

    it('does not render any link elements when game.links is empty', function() {
      const gameEmptyLinks = { ...game, links: [] };
      const html = renderToStaticMarkup(GameHelper.render(gameEmptyLinks));
      expect(html).not.toContain('<a href="http');
    });

    it('does not render any link elements when game.links is absent', function() {
      const gameNoLinks = { ...game };
      delete gameNoLinks.links;
      const html = renderToStaticMarkup(GameHelper.render(gameNoLinks));
      expect(html).not.toContain('<a href="http');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(GameHelper.renderLoading())).toContain('Loading game');
    });
  });

  describe('.renderError', function() {
    it('renders the error message in an alert', function() {
      const html = renderToStaticMarkup(GameHelper.renderError('Something went wrong'));
      expect(html).toContain('Something went wrong');
      expect(html).toContain('alert');
    });
  });
});
