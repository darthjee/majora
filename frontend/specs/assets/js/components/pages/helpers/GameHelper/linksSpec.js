import { renderToStaticMarkup } from 'react-dom/server';
import GameHelper from '../../../../../../../assets/js/components/pages/helpers/GameHelper.jsx';
import { buildLink } from '../../../../../../support/factories.js';
import { game } from './support.js';

describe('GameHelper', function() {
  describe('.render', function() {
    it('renders links when game.links contains items', function() {
      const gameWithLinks = {
        ...game,
        links: [
          buildLink({ text: 'Wiki', url: 'https://example.com/wiki' }),
          buildLink({ id: 2, text: 'Discord', url: 'https://discord.gg/example' }),
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
