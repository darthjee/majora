import { renderToStaticMarkup } from 'react-dom/server';
import GameHelper from '../../../../../../../assets/js/components/pages/helpers/GameHelper.jsx';

describe('GameHelper', function() {
  const game = {
    name: 'Epic Quest',
    game_slug: 'epic-quest',
    cover_photo_path: null,
    description: 'A heroic adventure.',
  };

  describe('.render', function() {
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
});
