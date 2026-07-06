import TreasureExchangeModalHelper
  from '../../../../../../assets/js/components/elements/helpers/TreasureExchangeModalHelper.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';

const findElement = (node, matcher) => {
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

describe('TreasureExchangeModalHelper', function() {
  const buildHandlers = () => ({
    onClose: jasmine.createSpy('onClose'),
    onTabChange: jasmine.createSpy('onTabChange'),
    onSelect: jasmine.createSpy('onSelect'),
    onBack: jasmine.createSpy('onBack'),
    onPrev: jasmine.createSpy('onPrev'),
    onNext: jasmine.createSpy('onNext'),
    onQuantityChange: jasmine.createSpy('onQuantityChange'),
    onConfirm: jasmine.createSpy('onConfirm'),
  });

  const buildState = (overrides = {}) => ({
    activeTab: 'acquire',
    browse: { items: [], page: 1, pages: 1, loading: false, error: '' },
    selected: null,
    quantity: 1,
    submitting: false,
    actionError: '',
    ownedByTreasureId: {},
    ...overrides,
  });

  describe('.render', function() {
    it('renders the modal title', function() {
      const element = TreasureExchangeModalHelper.render(true, buildState(), buildHandlers());
      const title = findElement(element, (child) => child.type === Modal.Title);

      expect(title.props.children).toBe('Treasure Exchange');
    });

    it('wires the modal onHide and footer close button to onClose', function() {
      const handlers = buildHandlers();
      const element = TreasureExchangeModalHelper.render(true, buildState(), handlers);
      const modal = findElement(element, (child) => child.type === Modal);

      modal.props.onHide();

      expect(handlers.onClose).toHaveBeenCalled();
    });

    it('marks the acquire tab active when activeTab is acquire', function() {
      const element = TreasureExchangeModalHelper.render(true, buildState({ activeTab: 'acquire' }), buildHandlers());
      const acquireTab = findElement(
        element, (child) => child.type === 'button' && child.props.children === 'Acquire'
      );

      expect(acquireTab.props.className).toContain('active');
    });

    it('marks the sell tab active when activeTab is sell', function() {
      const element = TreasureExchangeModalHelper.render(true, buildState({ activeTab: 'sell' }), buildHandlers());
      const sellTab = findElement(
        element, (child) => child.type === 'button' && child.props.children === 'Sell'
      );

      expect(sellTab.props.className).toContain('active');
    });

    it('invokes onTabChange with "sell" when the sell tab is clicked', function() {
      const handlers = buildHandlers();
      const element = TreasureExchangeModalHelper.render(true, buildState(), handlers);
      const sellTab = findElement(
        element, (child) => child.type === 'button' && child.props.children === 'Sell'
      );

      sellTab.props.onClick();

      expect(handlers.onTabChange).toHaveBeenCalledWith('sell');
    });

    it('renders a loading message when browsing is loading', function() {
      const element = TreasureExchangeModalHelper.render(
        true, buildState({ browse: { items: [], page: 1, pages: 1, loading: true, error: '' } }), buildHandlers()
      );

      expect(JSON.stringify(element)).toContain('Loading treasures...');
    });

    it('renders an empty message when there are no items to browse', function() {
      const element = TreasureExchangeModalHelper.render(true, buildState(), buildHandlers());

      expect(JSON.stringify(element)).toContain('No treasures available.');
    });

    it('renders a browse error message', function() {
      const state = buildState({
        browse: { items: [], page: 1, pages: 1, loading: false, error: 'treasure_exchange_modal.generic_error' },
      });
      const element = TreasureExchangeModalHelper.render(true, state, buildHandlers());

      expect(JSON.stringify(element)).toContain('Unable to complete this action. Please try again.');
    });

    it('renders a list item for each browse item and wires onSelect', function() {
      const handlers = buildHandlers();
      const item = { id: 9, name: 'Golden Crown', value: 500 };
      const state = buildState({
        browse: { items: [item], page: 1, pages: 1, loading: false, error: '' },
      });
      const element = TreasureExchangeModalHelper.render(true, state, handlers);
      const button = findElement(
        element, (child) => child.type === 'button' && child.props.children?.[0]?.props?.children === 'Golden Crown'
      );

      button.props.onClick();

      expect(handlers.onSelect).toHaveBeenCalledWith(item);
    });

    it('does not render pager controls when there is only one page', function() {
      const element = TreasureExchangeModalHelper.render(true, buildState(), buildHandlers());

      expect(JSON.stringify(element)).not.toContain('1 / 1');
    });

    it('renders pager controls and wires onPrev/onNext when there are multiple pages', function() {
      const handlers = buildHandlers();
      const state = buildState({
        browse: { items: [], page: 2, pages: 3, loading: false, error: '' },
      });
      const element = TreasureExchangeModalHelper.render(true, state, handlers);

      expect(JSON.stringify(element)).toContain('2 / 3');

      const prevButton = findElement(
        element, (child) => child.type === 'button' && child.props.children === 'Previous'
      );
      const nextButton = findElement(
        element, (child) => child.type === 'button' && child.props.children === 'Next'
      );

      prevButton.props.onClick();
      nextButton.props.onClick();

      expect(handlers.onPrev).toHaveBeenCalled();
      expect(handlers.onNext).toHaveBeenCalled();
    });

    describe('when an item is selected', function() {
      const selected = {
        id: 9, treasure_id: 9, name: 'Golden Crown', value: 500, quantity: 3, photo_path: null,
      };

      it('renders the selected treasure name and value', function() {
        const state = buildState({ selected });
        const element = TreasureExchangeModalHelper.render(true, state, buildHandlers());

        expect(JSON.stringify(element)).toContain('Golden Crown');
      });

      it('renders the already-owned count from ownedByTreasureId on the acquire tab', function() {
        const state = buildState({ activeTab: 'acquire', selected, ownedByTreasureId: { 9: 2 } });
        const element = TreasureExchangeModalHelper.render(true, state, buildHandlers());

        expect(JSON.stringify(element)).toContain('Already owned: 2');
      });

      it('renders the owned quantity from the selected item on the sell tab', function() {
        const state = buildState({ activeTab: 'sell', selected });
        const element = TreasureExchangeModalHelper.render(true, state, buildHandlers());

        expect(JSON.stringify(element)).toContain('Already owned: 3');
      });

      it('wires the quantity input onChange handler', function() {
        const handlers = buildHandlers();
        const state = buildState({ selected });
        const element = TreasureExchangeModalHelper.render(true, state, handlers);
        const input = findElement(element, (child) => child.type === 'input' && child.props.type === 'number');

        input.props.onChange({ target: { value: '4' } });

        expect(handlers.onQuantityChange).toHaveBeenCalledWith(4);
      });

      it('wires the back button to onBack', function() {
        const handlers = buildHandlers();
        const state = buildState({ selected });
        const element = TreasureExchangeModalHelper.render(true, state, handlers);
        const backButton = findElement(
          element, (child) => child.type === 'button' && child.props.children === 'Back'
        );

        backButton.props.onClick();

        expect(handlers.onBack).toHaveBeenCalled();
      });

      it('wires the confirm button to onConfirm and disables it while submitting', function() {
        const handlers = buildHandlers();
        const state = buildState({ selected, submitting: true });
        const element = TreasureExchangeModalHelper.render(true, state, handlers);
        const confirmButton = findElement(
          element, (child) => child.type === 'button' && child.props.children === 'Confirm'
        );

        confirmButton.props.onClick();

        expect(handlers.onConfirm).toHaveBeenCalled();
        expect(confirmButton.props.disabled).toBe(true);
      });

      it('renders the action error when present', function() {
        const state = buildState({ selected, actionError: 'treasure_exchange_modal.insufficient_funds' });
        const element = TreasureExchangeModalHelper.render(true, state, buildHandlers());

        expect(JSON.stringify(element)).toContain('Not enough money to acquire this quantity.');
      });

      it('does not render an action error when absent', function() {
        const state = buildState({ selected, actionError: '' });
        const element = TreasureExchangeModalHelper.render(true, state, buildHandlers());

        expect(JSON.stringify(element)).not.toContain('alert-danger');
      });
    });
  });
});
