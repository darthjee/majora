import TreasureExchangeModalHelper
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/TreasureExchangeModalHelper.jsx';
import { buildHandlers, buildState, findElement } from './support.js';

describe('TreasureExchangeModalHelper', function() {
  describe('.render', function() {
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

    it('renders an available units badge on the acquire tab, even when available_units is 0', function() {
      const item = { id: 9, name: 'Golden Crown', value: 500, available_units: 0 };
      const state = buildState({
        activeTab: 'acquire', browse: { items: [item], page: 1, pages: 1, loading: false, error: '' },
      });
      const element = TreasureExchangeModalHelper.render(true, state, buildHandlers());

      expect(JSON.stringify(element)).toContain('0 left');
    });

    it('renders an available units badge on the acquire tab when available_units is 1', function() {
      const item = { id: 9, name: 'Golden Crown', value: 500, available_units: 1 };
      const state = buildState({
        activeTab: 'acquire', browse: { items: [item], page: 1, pages: 1, loading: false, error: '' },
      });
      const element = TreasureExchangeModalHelper.render(true, state, buildHandlers());

      expect(JSON.stringify(element)).toContain('1 left');
    });

    it('does not render an available units badge when available_units is absent', function() {
      const item = { id: 9, name: 'Golden Crown', value: 500 };
      const state = buildState({
        activeTab: 'acquire', browse: { items: [item], page: 1, pages: 1, loading: false, error: '' },
      });
      const element = TreasureExchangeModalHelper.render(true, state, buildHandlers());

      expect(JSON.stringify(element)).not.toContain('left');
    });

    it('does not render an available units badge on the sell tab', function() {
      const item = { id: 9, treasure_id: 9, name: 'Golden Crown', value: 500, available_units: 3 };
      const state = buildState({
        activeTab: 'sell', browse: { items: [item], page: 1, pages: 1, loading: false, error: '' },
      });
      const element = TreasureExchangeModalHelper.render(true, state, buildHandlers());

      expect(JSON.stringify(element)).not.toContain('left');
    });

    it('renders the partial fulfillment notice when present', function() {
      const state = buildState({ partialNotice: 'Only 2 of 5 were available and were acquired.' });
      const element = TreasureExchangeModalHelper.render(true, state, buildHandlers());

      expect(JSON.stringify(element)).toContain('Only 2 of 5 were available and were acquired.');
    });

    it('does not render a partial fulfillment notice when absent', function() {
      const element = TreasureExchangeModalHelper.render(true, buildState(), buildHandlers());

      expect(JSON.stringify(element)).not.toContain('alert-info');
    });
  });
});
