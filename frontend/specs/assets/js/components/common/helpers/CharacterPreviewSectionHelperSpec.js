import { renderToStaticMarkup } from 'react-dom/server';
import CharacterPreviewSectionHelper
  from '../../../../../../assets/js/components/common/helpers/CharacterPreviewSectionHelper.jsx';
import Icons from '../../../../../../assets/js/utils/ui/Icons.js';
import { buildCharacter } from '../../../../../support/factories.js';

describe('CharacterPreviewSectionHelper', function() {
  const gameSlug = 'epic-quest';
  const title = 'Player Characters';
  const seeAllHref = '#/games/epic-quest/pcs';
  const icon = Icons.filePerson;

  const buildCharacters = (count) => Array.from({ length: count }, (_, index) => buildCharacter({
    id: index + 1,
    name: `Character ${index + 1}`,
  }));

  describe('.render', function() {
    it('renders the title as a heading', function() {
      const html = renderToStaticMarkup(
        CharacterPreviewSectionHelper.render(buildCharacters(2), gameSlug, 'pc', title, seeAllHref, icon)
      );
      expect(html).toContain('Player Characters');
    });

    it('renders a card for each character when within the preview limit', function() {
      const html = renderToStaticMarkup(
        CharacterPreviewSectionHelper.render(buildCharacters(3), gameSlug, 'pc', title, seeAllHref, icon)
      );
      expect(html).toContain('Character 1');
      expect(html).toContain('Character 2');
      expect(html).toContain('Character 3');
    });

    it('slices the characters to the max preview count', function() {
      const html = renderToStaticMarkup(
        CharacterPreviewSectionHelper.render(buildCharacters(8), gameSlug, 'pc', title, seeAllHref, icon)
      );
      expect(html).toContain('Character 6');
      expect(html).not.toContain('Character 7');
      expect(html).not.toContain('Character 8');
    });

    it('renders character preview cards matching the SeeAllCard column classes', function() {
      const html = renderToStaticMarkup(
        CharacterPreviewSectionHelper.render(buildCharacters(1), gameSlug, 'pc', title, seeAllHref, icon)
      );
      expect(html).toContain('col-6 col-sm-4 col-md-3 col-lg-2');
    });

    it('renders a see all card with the provided href and icon', function() {
      const html = renderToStaticMarkup(
        CharacterPreviewSectionHelper.render(buildCharacters(1), gameSlug, 'pc', title, seeAllHref, icon)
      );
      expect(html).toContain(`href="${seeAllHref}"`);
      expect(html).toContain('See all Player Characters');
      expect(html).toContain(icon);
    });

    it('renders an empty row when there are no characters', function() {
      const html = renderToStaticMarkup(
        CharacterPreviewSectionHelper.render([], gameSlug, 'pc', title, seeAllHref, icon)
      );
      expect(html).toContain('Player Characters');
      expect(html).toContain(`href="${seeAllHref}"`);
    });

    it('builds character links for the npc character type', function() {
      const html = renderToStaticMarkup(
        CharacterPreviewSectionHelper.render(buildCharacters(1), gameSlug, 'npc', title, seeAllHref, icon)
      );
      expect(html).toContain('href="#/games/epic-quest/npcs/1"');
    });

    it('renders CharacterPreviewCard instead of CharacterCard, with no management overlay', function() {
      const html = renderToStaticMarkup(
        CharacterPreviewSectionHelper.render(buildCharacters(1), gameSlug, 'npc', title, seeAllHref, icon)
      );
      expect(html).not.toContain('actions-overlay');
      expect(html).not.toContain('info-overlay');
    });
  });
});
