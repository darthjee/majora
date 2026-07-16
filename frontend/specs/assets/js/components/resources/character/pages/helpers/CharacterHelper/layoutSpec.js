import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx';
import { buildLink } from '../../../../../../../../support/factories.js';
import { character } from './support.js';

describe('CharacterHelper', function() {
  describe('.render', function() {
    it('renders the name, links and money inside the left column, and role/description in the right column', function() {
      const c = {
        ...character,
        links: [buildLink({ text: 'Wiki', url: 'https://example.com/wiki' })],
        money: 310,
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      const leftColStart = html.indexOf('class="col-md-4"');
      const rightColStart = html.indexOf('class="col-md-8"');
      const nameIndex = html.indexOf('Aragorn');
      const linkIndex = html.indexOf('href="https://example.com/wiki"');
      const moneyIndex = html.indexOf('coin-box-cp');
      const roleIndex = html.indexOf('Ranger');

      expect(leftColStart).toBeGreaterThan(-1);
      expect(rightColStart).toBeGreaterThan(leftColStart);
      expect(nameIndex).toBeGreaterThan(leftColStart);
      expect(nameIndex).toBeLessThan(rightColStart);
      expect(linkIndex).toBeGreaterThan(leftColStart);
      expect(linkIndex).toBeLessThan(rightColStart);
      expect(moneyIndex).toBeGreaterThan(leftColStart);
      expect(moneyIndex).toBeLessThan(rightColStart);
      expect(roleIndex).toBeGreaterThan(rightColStart);
    });

    it('renders DM notes and the treasures preview inside the right column, and keeps the photos preview outside the row', function() {
      const c = {
        ...character,
        game_slug: 'demo',
        id: 7,
        is_pc: true,
        private_description: 'Secret DM notes.',
        treasures: [{ id: 1, treasure_id: 9, name: 'Potion of Healing', quantity: 1, value: 50 }],
        photos: [{ id: 1, path: '/photos/1.jpg' }],
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      const rightColStart = html.indexOf('class="col-md-8"');
      const dmNotesIndex = html.indexOf('Secret DM notes.');
      const treasureIndex = html.indexOf('Potion of Healing');
      // react-dom prepends an image preload <link> for the first occurrence of any
      // <img>/photo src (including the photo card's), so the real, in-body usage of
      // the photo path is its *last* occurrence, not its first.
      const photoIndex = html.lastIndexOf('/photos/1.jpg');

      expect(dmNotesIndex).toBeGreaterThan(rightColStart);
      expect(treasureIndex).toBeGreaterThan(rightColStart);
      expect(photoIndex).toBeGreaterThan(treasureIndex);
      expect(photoIndex).toBeGreaterThan(dmNotesIndex);
    });
  });
});
