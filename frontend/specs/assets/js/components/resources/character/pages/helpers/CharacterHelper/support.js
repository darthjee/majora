import { buildCharacter } from '../../../../../../../../support/factories.js';

export const character = buildCharacter({
  name: 'Aragorn',
  role: 'Ranger',
  public_description: 'The future king of Gondor.',
});

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

  if (typeof node.type === 'function') {
    // Some slot components (e.g. `DescriptionBox`) use hooks and cannot be safely invoked
    // outside of a real React render pass; skip those branches instead of letting the
    // "Invalid hook call" exception abort the whole search, so sibling (hook-free) branches
    // (e.g. the preview sections) can still be found.
    let rendered;

    try {
      rendered = node.type(node.props);
    } catch {
      return null;
    }

    return findElement(rendered, matcher);
  }

  return findElement(node.props?.children, matcher);
};
