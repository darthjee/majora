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

  return findElement(node.props?.children, matcher);
};
