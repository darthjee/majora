export const buildHandlers = () => ({
  onSelect: jasmine.createSpy('onSelect'),
  onCancel: jasmine.createSpy('onCancel'),
  onPrev: jasmine.createSpy('onPrev'),
  onNext: jasmine.createSpy('onNext'),
  onHiddenChange: jasmine.createSpy('onHiddenChange'),
  onConfirm: jasmine.createSpy('onConfirm'),
  onSearchChange: jasmine.createSpy('onSearchChange'),
});

export const buildState = (overrides = {}) => ({
  browse: { items: [], page: 1, pages: 1, loading: false, error: '' },
  selected: null,
  hidden: false,
  submitting: false,
  actionError: '',
  search: '',
  ...overrides,
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
