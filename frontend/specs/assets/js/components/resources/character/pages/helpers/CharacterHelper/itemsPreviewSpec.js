import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx';
import PreviewSection from '../../../../../../../../../assets/js/components/common/cards/PreviewSection.jsx';
import ItemPreviewCard from '../../../../../../../../../assets/js/components/common/cards/ItemPreviewCard.jsx';
import { character } from './support.js';

/**
 * Depth-first search over a React element tree, matching against `props.children`
 * only (never invoking function components), mirroring the treasures preview spec's
 * helper of the same shape.
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
 * Locates the items `<PreviewSection>` element (distinguished from the sibling
 * treasures preview section by its empty-state text) and invokes its
 * `renderItem` for the given owned item, then renders the resulting
 * `ItemPreviewCard` (a plain, hook-free function component) to reach its
 * tooltip content.
 *
 * @param {object} characterWithItems - Character data including `items`.
 * @param {string} backHref - Hash path to the character's index page.
 * @param {object} item - Owned item object passed to `renderItem`.
 * @returns {React.ReactNode} The rendered `ItemPreviewCard`'s tooltip content.
 */
function buildTooltipContent(characterWithItems, backHref, item) {
  const tree = CharacterHelper.render(characterWithItems, backHref);
  const section = findElementShallow(
    tree, (node) => node.type === PreviewSection && node.props.emptyText === 'No items yet.',
  );
  const cardElement = section.props.renderItem(item);
  const cardTree = ItemPreviewCard(cardElement.props);

  return cardTree.props.children.props.content;
}

describe('CharacterHelper', function() {
  describe('items preview section', function() {
    it('renders the heading, defaulting to an empty list', function() {
      const withItems = {
        ...character,
        items: [{
          id: 1, game_item_id: 9, name: 'Cloak of Elvenkind', description: 'Grants stealth.',
        }],
      };
      const html = renderToStaticMarkup(CharacterHelper.render(withItems, '#/games/demo/pcs'));
      expect(html).toContain('Items');
      expect(renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'))).toContain('Items');
    });

    it('feeds the item name and description to the tooltip content', function() {
      const withItems = { ...character, items: [] };
      const item = {
        id: 1, game_item_id: 9, name: 'Cloak of Elvenkind', description: 'Grants stealth.',
      };
      const content = buildTooltipContent(withItems, '#/games/demo/pcs', item);
      const html = renderToStaticMarkup(content);

      expect(html).toContain('Cloak of Elvenkind');
      expect(html).toContain('Grants stealth.');
    });

    it('renders a see all link to the pcs items page', function() {
      const c = {
        ...character, game_slug: 'demo', id: 7, is_pc: true, items: [],
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('href="#/games/demo/pcs/7/items"');
    });

    it('renders a see all link to the npcs items page', function() {
      const c = {
        ...character, game_slug: 'demo', id: 7, is_pc: false, items: [],
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));
      expect(html).toContain('href="#/games/demo/npcs/7/items"');
    });

    it('renders the empty-state message when there are no items', function() {
      const html = renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'));
      expect(html).toContain('No items yet.');
    });
  });
});
