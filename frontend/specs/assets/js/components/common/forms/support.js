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

  if (!node.props) {
    return null;
  }

  for (const value of Object.values(node.props)) {
    const match = findElement(value, matcher);

    if (match) {
      return match;
    }
  }

  return null;
};
