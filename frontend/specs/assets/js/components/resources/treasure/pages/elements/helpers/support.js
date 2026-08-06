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

  // Walks every prop value (not just `children`), so elements passed through named props (e.g.
  // `TwoColumnLayout`'s `browsePane`/`detailPane`) are still reachable.
  for (const value of Object.values(node.props)) {
    const match = findElement(value, matcher);

    if (match) {
      return match;
    }
  }

  return null;
};

const hasIconClass = (node, iconClass) => (
  typeof node?.props?.className === 'string' && node.props.className.includes(iconClass)
);

export const findButtonWithIcon = (tree, iconClass) => (
  findElement(tree, (node) => node.type === 'button' && findElement(node.props?.children, (child) => hasIconClass(child, iconClass)))
);
