export const buildHandlers = () => ({
  onClose: jasmine.createSpy('onClose'),
  onTabChange: jasmine.createSpy('onTabChange'),
});

const FakeBuyComponent = function FakeBuyComponent() {
  return null;
};

const FakeSellComponent = function FakeSellComponent() {
  return null;
};

export const buildTabs = () => ({
  buy: { labelKey: 'treasure_exchange_modal.buy_tab', tooltipKey: 'treasure_exchange_modal.buy_tab_tooltip', Component: FakeBuyComponent },
  sell: { labelKey: 'treasure_exchange_modal.sell_tab', tooltipKey: 'treasure_exchange_modal.sell_tab_tooltip', Component: FakeSellComponent },
});

export const buildState = (overrides = {}) => ({
  activeTab: 'buy',
  tabs: buildTabs(),
  character: null,
  ownedTreasures: [],
  gameType: 'dnd',
  onSuccess: jasmine.createSpy('onSuccess'),
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
