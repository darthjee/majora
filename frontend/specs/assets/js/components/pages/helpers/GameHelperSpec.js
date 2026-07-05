import { renderToStaticMarkup } from 'react-dom/server';
import GameHelper from '../../../../../../assets/js/components/pages/helpers/GameHelper.jsx';
import PhotoUploadOverlay from '../../../../../../assets/js/components/elements/PhotoUploadOverlay.jsx';

const findElement = (node, matcher) => {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, matcher);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (typeof node !== 'object') {
    return null;
  }

  if (matcher(node)) {
    return node;
  }

  return findElement(node.props?.children, matcher);
};

describe('GameHelper', function() {
  const game = {
    name: 'Epic Quest',
    game_slug: 'epic-quest',
    cover_photo_path: null,
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
      const pcs = [{ id: 1, name: 'Aragorn', profile_photo_path: null }];
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
      const npcs = [{ id: 2, name: 'Gandalf', profile_photo_path: null }];
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

    it('renders the cover photo when cover_photo_path is provided', function() {
      const gameWithPhoto = {
        ...game,
        cover_photo_path: 'http://example.com/cover_photo.png',
      };
      const html = renderToStaticMarkup(GameHelper.render(gameWithPhoto));
      expect(html).toContain('http://example.com/cover_photo.png');
    });

    it('renders the photo upload overlay button when can_edit is true', function() {
      const editableGame = { ...game, can_edit: true };
      const html = renderToStaticMarkup(GameHelper.render(editableGame));
      expect(html).toContain('photo-upload-overlay-button');
    });

    it('does not render the photo upload overlay button when can_edit is false', function() {
      const nonEditableGame = { ...game, can_edit: false };
      const html = renderToStaticMarkup(GameHelper.render(nonEditableGame));
      expect(html).not.toContain('photo-upload-overlay-button');
    });

    it('does not render the photo upload overlay button when can_edit is absent', function() {
      const html = renderToStaticMarkup(GameHelper.render(game));
      expect(html).not.toContain('photo-upload-overlay-button');
    });

    it('invokes onOpenUploadModal when the overlay button is clicked', function() {
      const onOpenUploadModal = jasmine.createSpy('onOpenUploadModal');
      const editableGame = { ...game, can_edit: true };
      const element = GameHelper.render(editableGame, [], [], { onOpenUploadModal });
      const overlay = findElement(element, (child) => child.type === PhotoUploadOverlay);

      overlay.props.onClick();

      expect(onOpenUploadModal).toHaveBeenCalled();
    });

    it('does not render the old inline photo gallery', function() {
      const html = renderToStaticMarkup(GameHelper.render(game));
      expect(html).not.toContain('img-fluid rounded');
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

    it('does not render the treasures/sessions/photos buttons at the bottom of the page', function() {
      const html = renderToStaticMarkup(GameHelper.render(game));
      expect(html).not.toContain(`href="#/games/${game.game_slug}/treasures"`);
      expect(html).not.toContain(`href="#/games/${game.game_slug}/sessions"`);
      expect(html).not.toContain(`href="#/games/${game.game_slug}/photos"`);
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
