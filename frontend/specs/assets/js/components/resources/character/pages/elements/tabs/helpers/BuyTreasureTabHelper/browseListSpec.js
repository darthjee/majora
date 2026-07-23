import BuyTreasureTabHelper
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/helpers/BuyTreasureTabHelper.jsx';
import TreasureMoney
  from '../../../../../../../../../../../assets/js/components/common/misc/TreasureMoney.jsx';
import BrowsePager
  from '../../../../../../../../../../../assets/js/components/common/pagination/BrowsePager.jsx';
import { buildHandlers, buildState, findElement } from './support.js';

describe('BuyTreasureTabHelper', function() {
  describe('.render', function() {
    it('renders a loading message when browsing is loading', function() {
      const element = BuyTreasureTabHelper.render(
        buildState({ browse: { items: [], page: 1, pages: 1, loading: true, error: '' } }), buildHandlers()
      );

      expect(JSON.stringify(element)).toContain('Loading treasures...');
    });

    it('renders an empty message when there are no items to browse', function() {
      const element = BuyTreasureTabHelper.render(buildState(), buildHandlers());

      expect(JSON.stringify(element)).toContain('No treasures available.');
    });

    it('renders a browse error message', function() {
      const state = buildState({
        browse: { items: [], page: 1, pages: 1, loading: false, error: 'treasure_exchange_modal.generic_error' },
      });
      const element = BuyTreasureTabHelper.render(state, buildHandlers());

      expect(JSON.stringify(element)).toContain('Unable to complete this action. Please try again.');
    });

    it('renders a list item for each browse item and wires onSelect', function() {
      const handlers = buildHandlers();
      const item = { id: 9, name: 'Golden Crown', value: 500 };
      const state = buildState({ browse: { items: [item], page: 1, pages: 1, loading: false, error: '' } });
      const element = BuyTreasureTabHelper.render(state, handlers);
      const button = findElement(
        element, (child) => child.type === 'button' && child.props.children?.[0]?.props?.children === 'Golden Crown'
      );

      button.props.onClick();

      expect(handlers.onSelect).toHaveBeenCalledWith(item);
    });

    it('passes the browse state and handlers to BrowsePager', function() {
      const handlers = buildHandlers();
      const browse = { items: [], page: 2, pages: 3, loading: false, error: '' };
      const state = buildState({ browse });
      const element = BuyTreasureTabHelper.render(state, handlers);
      const pager = findElement(element, (child) => child.type === BrowsePager);

      expect(pager.props.browse).toBe(browse);
      expect(pager.props.onPrev).toBe(handlers.onPrev);
      expect(pager.props.onNext).toBe(handlers.onNext);
    });

    it('renders an available units badge, even when available_units is 0', function() {
      const item = { id: 9, name: 'Golden Crown', value: 500, available_units: 0 };
      const state = buildState({ browse: { items: [item], page: 1, pages: 1, loading: false, error: '' } });
      const element = BuyTreasureTabHelper.render(state, buildHandlers());

      expect(JSON.stringify(element)).toContain('0 left');
    });

    it('renders an available units badge when available_units is 1', function() {
      const item = { id: 9, name: 'Golden Crown', value: 500, available_units: 1 };
      const state = buildState({ browse: { items: [item], page: 1, pages: 1, loading: false, error: '' } });
      const element = BuyTreasureTabHelper.render(state, buildHandlers());

      expect(JSON.stringify(element)).toContain('1 left');
    });

    it('does not render an available units badge when available_units is absent', function() {
      const item = { id: 9, name: 'Golden Crown', value: 500 };
      const state = buildState({ browse: { items: [item], page: 1, pages: 1, loading: false, error: '' } });
      const element = BuyTreasureTabHelper.render(state, buildHandlers());

      expect(JSON.stringify(element)).not.toContain('left');
    });

    it('renders the partial fulfillment notice when present', function() {
      const state = buildState({ partialNotice: 'Only 2 of 5 were available and were acquired.' });
      const element = BuyTreasureTabHelper.render(state, buildHandlers());

      expect(JSON.stringify(element)).toContain('Only 2 of 5 were available and were acquired.');
    });

    it('does not render a partial fulfillment notice when absent', function() {
      const element = BuyTreasureTabHelper.render(buildState(), buildHandlers());

      expect(JSON.stringify(element)).not.toContain('alert-info');
    });

    it('renders each browse item value using the given gameType', function() {
      const item = { id: 9, name: 'Golden Crown', value: 350 };
      const state = buildState({
        browse: { items: [item], page: 1, pages: 1, loading: false, error: '' }, gameType: 'deadlands',
      });
      const element = BuyTreasureTabHelper.render(state, buildHandlers());
      const moneyElement = findElement(element, (child) => child.type === TreasureMoney);

      expect(moneyElement.props.value).toBe(350);
      expect(moneyElement.props.gameType).toBe('deadlands');
    });
  });
});
