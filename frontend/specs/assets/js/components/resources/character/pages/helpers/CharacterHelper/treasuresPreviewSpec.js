import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx';
import PreviewSection from '../../../../../../../../../assets/js/components/common/PreviewSection.jsx';
import TreasurePreviewCard from '../../../../../../../../../assets/js/components/common/TreasurePreviewCard.jsx';
import { character } from './support.js';

/**
 * Depth-first search over a React element tree, matching against `props.children`
 * only (never invoking function components), so it is safe to use on trees
 * containing hook-using components (e.g. the treasures preview section sits
 * alongside `DescriptionBox`-backed sibling elements).
 *
 * @param {*} node - React node (element, array, or primitive) to search.
 * @param {Function} matcher - Predicate `(node) => boolean`.
 * @returns {*} The first matching node, or `null` when none matches.
 */
function findElementShallow(node, matcher) {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElementShallow(child, matcher);

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

  return findElementShallow(node.props?.children, matcher);
}

/**
 * Locates the treasures `<PreviewSection>` element and invokes its `renderItem`
 * for the given owned treasure, then renders the resulting `TreasurePreviewCard`
 * (a plain, hook-free function component) to reach its tooltip content.
 *
 * @param {object} characterWithTreasures - Character data including `treasures`.
 * @param {string} backHref - Hash path to the character's index page.
 * @param {object} treasure - Owned treasure object passed to `renderItem`.
 * @returns {React.ReactNode} The rendered `TreasurePreviewCard`'s tooltip content.
 */
function buildTooltipContent(characterWithTreasures, backHref, treasure) {
  const tree = CharacterHelper.render(characterWithTreasures, backHref);
  const section = findElementShallow(tree, (node) => node.type === PreviewSection);
  const cardElement = section.props.renderItem(treasure);
  const cardTree = TreasurePreviewCard(cardElement.props);

  return cardTree.props.children.props.content;
}

describe('CharacterHelper', function() {
  describe('treasures preview section', function() {
    it('renders the heading and a card linking to the underlying treasure_id, defaulting to an empty list', function() {
      const withTreasures = {
        ...character,
        treasures: [{ id: 1, treasure_id: 9, name: 'Potion of Healing', quantity: 3, value: 50 }],
      };
      const html = renderToStaticMarkup(CharacterHelper.render(withTreasures, '#/games/demo/pcs'));
      expect(html).toContain('Treasures');
      expect(html).toContain('href="#/treasures/9"');
      expect(renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'))).toContain('Treasures');
    });

    it('feeds the treasure name and quantity to the tooltip content when quantity is greater than 1', function() {
      const withTreasures = { ...character, treasures: [] };
      const treasure = {
        id: 1, treasure_id: 9, name: 'Potion of Healing', quantity: 3, value: 50,
      };
      const content = buildTooltipContent(withTreasures, '#/games/demo/pcs', treasure);
      const html = renderToStaticMarkup(content);

      expect(html).toContain('Potion of Healing');
      expect(html).toContain('×3');
    });

    it('does not render a quantity suffix in the tooltip content when the treasure quantity is 1', function() {
      const withTreasures = { ...character, treasures: [] };
      const treasure = {
        id: 1, treasure_id: 9, name: 'Potion of Healing', quantity: 1, value: 50,
      };
      const content = buildTooltipContent(withTreasures, '#/games/demo/pcs', treasure);
      const html = renderToStaticMarkup(content);

      expect(html).not.toContain('×1');
    });

    it('renders each tooltip content value using the character\'s game_type', function() {
      const withTreasures = { ...character, treasures: [], game_type: 'deadlands' };
      const treasure = {
        id: 1, treasure_id: 9, name: 'Potion of Healing', quantity: 1, value: 350,
      };
      const content = buildTooltipContent(withTreasures, '#/games/demo/pcs', treasure);
      const html = renderToStaticMarkup(content);

      expect(html).toContain('3 Dollars and 50 Cents');
    });

    it('renders a see all link to the pcs treasures page', function() {
      const c = { ...character, game_slug: 'demo', id: 7, is_pc: true, treasures: [] };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('href="#/games/demo/pcs/7/treasures"');
    });

    it('renders a see all link to the npcs treasures page', function() {
      const c = { ...character, game_slug: 'demo', id: 7, is_pc: false, treasures: [] };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));
      expect(html).toContain('href="#/games/demo/npcs/7/treasures"');
    });

    it('renders the empty-state message when there are no treasures', function() {
      const html = renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'));
      expect(html).toContain('No treasures yet.');
    });
  });
});
