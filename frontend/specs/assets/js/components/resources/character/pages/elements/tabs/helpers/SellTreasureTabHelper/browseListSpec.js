import SellTreasureTabHelper
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/helpers/SellTreasureTabHelper.jsx';
import TreasureMoney
  from '../../../../../../../../../../../assets/js/components/common/misc/TreasureMoney.jsx';
import BrowsePager
  from '../../../../../../../../../../../assets/js/components/common/pagination/BrowsePager.jsx';
import { buildHandlers, buildState, findElement } from './support.js';

describe('SellTreasureTabHelper', function() {
  describe('.render', function() {
    it('renders a loading message when browsing is loading', function() {
      const element = SellTreasureTabHelper.render(
        buildState({ browse: { items: [], page: 1, pages: 1, loading: true, error: '' } }), buildHandlers()
      );

      expect(JSON.stringify(element)).toContain('Loading treasures...');
    });

    it('renders an empty message when there are no items to browse', function() {
      const element = SellTreasureTabHelper.render(buildState(), buildHandlers());

      expect(JSON.stringify(element)).toContain('No treasures available.');
    });

    it('renders a browse error message', function() {
      const state = buildState({
        browse: { items: [], page: 1, pages: 1, loading: false, error: 'treasure_exchange_modal.generic_error' },
      });
      const element = SellTreasureTabHelper.render(state, buildHandlers());

      expect(JSON.stringify(element)).toContain('Unable to complete this action. Please try again.');
    });

    it('renders a list item for each owned treasure and wires onSelect', function() {
      const handlers = buildHandlers();
      const item = {
        id: 1, treasure_id: 9, name: 'Ring', value: 50, quantity: 3,
      };
      const state = buildState({ browse: { items: [item], page: 1, pages: 1, loading: false, error: '' } });
      const element = SellTreasureTabHelper.render(state, handlers);
      const button = findElement(
        element, (child) => child.type === 'button' && child.props.children?.[0]?.props?.children === 'Ring'
      );

      button.props.onClick();

      expect(handlers.onSelect).toHaveBeenCalledWith(item);
    });

    it('does not render an available units badge (owned treasures have no cap)', function() {
      const item = {
        id: 1, treasure_id: 9, name: 'Ring', value: 50, quantity: 3,
      };
      const state = buildState({ browse: { items: [item], page: 1, pages: 1, loading: false, error: '' } });
      const element = SellTreasureTabHelper.render(state, buildHandlers());

      expect(JSON.stringify(element)).not.toContain('left');
    });

    it('passes the browse state and handlers to BrowsePager', function() {
      const handlers = buildHandlers();
      const browse = { items: [], page: 2, pages: 3, loading: false, error: '' };
      const state = buildState({ browse });
      const element = SellTreasureTabHelper.render(state, handlers);
      const pager = findElement(element, (child) => child.type === BrowsePager);

      expect(pager.props.browse).toBe(browse);
      expect(pager.props.onPrev).toBe(handlers.onPrev);
      expect(pager.props.onNext).toBe(handlers.onNext);
    });

    it('renders each browse item value using the given gameType', function() {
      const item = {
        id: 1, treasure_id: 9, name: 'Ring', value: 350, quantity: 3,
      };
      const state = buildState({
        browse: { items: [item], page: 1, pages: 1, loading: false, error: '' }, gameType: 'deadlands',
      });
      const element = SellTreasureTabHelper.render(state, buildHandlers());
      const moneyElement = findElement(element, (child) => child.type === TreasureMoney);

      expect(moneyElement.props.value).toBe(350);
      expect(moneyElement.props.gameType).toBe('deadlands');
    });
  });
});
