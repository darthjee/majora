export const buildHandlers = () => ({
  onClose: jasmine.createSpy('onClose'),
  onSelect: jasmine.createSpy('onSelect'),
  onBack: jasmine.createSpy('onBack'),
  onPrev: jasmine.createSpy('onPrev'),
  onNext: jasmine.createSpy('onNext'),
  onValueChange: jasmine.createSpy('onValueChange'),
  onHiddenChange: jasmine.createSpy('onHiddenChange'),
  onHasMaxUnitsChange: jasmine.createSpy('onHasMaxUnitsChange'),
  onMaxUnitsChange: jasmine.createSpy('onMaxUnitsChange'),
  onSubmit: jasmine.createSpy('onSubmit'),
});

export const buildState = (overrides = {}) => ({
  browse: { items: [], page: 1, pages: 1, loading: false, error: '' },
  selected: null,
  formState: {
    value: '', hidden: false, hasMaxUnits: false, maxUnits: '',
  },
  submitting: false,
  actionError: '',
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
