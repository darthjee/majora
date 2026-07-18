import { buildGame } from '../../../../../../../../support/factories.js';

export const game = buildGame({
  name: 'Epic Quest',
  game_slug: 'epic-quest',
  cover_photo_path: null,
  description: 'A heroic adventure.',
});

/**
 * Depth-first search over a React element tree, matching against `props.children`
 * only (never invoking function components), so it is safe to use on trees
 * containing hook-using components (e.g. `OpenPollsWidget`).
 *
 * @param {*} node - React node (element, array, or primitive) to search.
 * @param {Function} matcher - Predicate `(node) => boolean`.
 * @returns {*} The first matching node, or `null` when none matches.
 */
export const findElement = (node, matcher) => {
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
