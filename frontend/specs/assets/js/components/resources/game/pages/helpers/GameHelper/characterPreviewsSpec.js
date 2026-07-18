import { renderToStaticMarkup } from 'react-dom/server';
import GameHelper from '../../../../../../../../../assets/js/components/resources/game/pages/helpers/GameHelper.jsx';
import PreviewSection from '../../../../../../../../../assets/js/components/common/cards/PreviewSection.jsx';
import CharacterPreviewCard from '../../../../../../../../../assets/js/components/common/cards/CharacterPreviewCard.jsx';
import { buildCharacter } from '../../../../../../../../support/factories.js';
import { game, findElement } from './support.js';

describe('GameHelper', function() {
  describe('.render', function() {
    it('renders the player characters preview section', function() {
      const pcs = [buildCharacter({ id: 1, name: 'Aragorn' })];
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
      const npcs = [buildCharacter({ id: 2, name: 'Gandalf' })];
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

    it('feeds the pc name to the preview card tooltip content', function() {
      const pcs = [buildCharacter({ id: 1, name: 'Aragorn' })];
      const tree = GameHelper.render(game, pcs);
      const section = findElement(
        tree, (node) => node.type === PreviewSection && node.props.seeAllHref === '#/games/epic-quest/pcs'
      );
      const cardElement = section.props.renderItem(pcs[0]);
      const cardTree = CharacterPreviewCard(cardElement.props);

      expect(cardTree.props.children.props.content).toBe('Aragorn');
    });

    it('feeds the npc name to the preview card tooltip content', function() {
      const npcs = [buildCharacter({ id: 2, name: 'Gandalf' })];
      const tree = GameHelper.render(game, [], npcs);
      const section = findElement(
        tree, (node) => node.type === PreviewSection && node.props.seeAllHref === '#/games/epic-quest/npcs'
      );
      const cardElement = section.props.renderItem(npcs[0]);
      const cardTree = CharacterPreviewCard(cardElement.props);

      expect(cardTree.props.children.props.content).toBe('Gandalf');
    });
  });
});
