export const buildHandlers = () => ({
  onClose: jasmine.createSpy('onClose'),
  onTabChange: jasmine.createSpy('onTabChange'),
  onSelect: jasmine.createSpy('onSelect'),
  onBack: jasmine.createSpy('onBack'),
  onPrev: jasmine.createSpy('onPrev'),
  onNext: jasmine.createSpy('onNext'),
  onQuantityChange: jasmine.createSpy('onQuantityChange'),
  onConfirm: jasmine.createSpy('onConfirm'),
});

export const buildState = (overrides = {}) => ({
  activeTab: 'acquire',
  browse: { items: [], page: 1, pages: 1, loading: false, error: '' },
  selected: null,
  quantity: 1,
  submitting: false,
  actionError: '',
  partialNotice: '',
  ownedByTreasureId: {},
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

  return findElement(node.props?.children, matcher);
};
