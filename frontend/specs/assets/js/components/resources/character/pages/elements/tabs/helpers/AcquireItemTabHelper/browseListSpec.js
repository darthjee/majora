import AcquireItemTabHelper
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/helpers/AcquireItemTabHelper.jsx';
import BrowsePager
  from '../../../../../../../../../../../assets/js/components/common/pagination/BrowsePager.jsx';
import { buildHandlers, buildState, findElement } from './support.js';

describe('AcquireItemTabHelper', function() {
  describe('.render', function() {
    it('renders a loading message when browsing is loading', function() {
      const element = AcquireItemTabHelper.render(
        buildState({ browse: { items: [], page: 1, pages: 1, loading: true, error: '' } }), buildHandlers()
      );

      expect(JSON.stringify(element)).toContain('Loading items...');
    });

    it('renders an empty message when there are no items to browse', function() {
      const element = AcquireItemTabHelper.render(buildState(), buildHandlers());

      expect(JSON.stringify(element)).toContain('No items available.');
    });

    it('renders a browse error message', function() {
      const state = buildState({
        browse: { items: [], page: 1, pages: 1, loading: false, error: 'item_exchange_modal.generic_error' },
      });
      const element = AcquireItemTabHelper.render(state, buildHandlers());

      expect(JSON.stringify(element)).toContain('Unable to complete this action. Please try again.');
    });

    it('renders a list item for each browse item and wires onSelect', function() {
      const handlers = buildHandlers();
      const item = { id: 9, name: 'Sting' };
      const state = buildState({ browse: { items: [item], page: 1, pages: 1, loading: false, error: '' } });
      const element = AcquireItemTabHelper.render(state, handlers);
      const button = findElement(
        element, (child) => child.type === 'button' && child.props.children?.props?.children === 'Sting'
      );

      button.props.onClick();

      expect(handlers.onSelect).toHaveBeenCalledWith(item);
    });

    it('passes the browse state and handlers to BrowsePager', function() {
      const handlers = buildHandlers();
      const browse = { items: [], page: 2, pages: 3, loading: false, error: '' };
      const state = buildState({ browse });
      const element = AcquireItemTabHelper.render(state, handlers);
      const pager = findElement(element, (child) => child.type === BrowsePager);

      expect(pager.props.browse).toBe(browse);
      expect(pager.props.onPrev).toBe(handlers.onPrev);
      expect(pager.props.onNext).toBe(handlers.onNext);
    });

    it('renders the search placeholder', function() {
      const element = AcquireItemTabHelper.render(buildState(), buildHandlers());

      expect(JSON.stringify(element)).toContain('Search items...');
    });
  });
});
