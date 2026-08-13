import RemovePossessionTabHelper
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/helpers/RemovePossessionTabHelper.jsx';
import BrowsePager
  from '../../../../../../../../../../../assets/js/components/common/pagination/BrowsePager.jsx';
import TwoColumnLayout
  from '../../../../../../../../../../../assets/js/components/common/layout/TwoColumnLayout.jsx';
import { buildHandlers, buildState, findElement } from './support.js';

describe('RemovePossessionTabHelper', function() {
  describe('.render', function() {
    it('passes a null detailPane to TwoColumnLayout when nothing is selected', function() {
      const element = RemovePossessionTabHelper.render(buildState(), buildHandlers());
      const layout = findElement(element, (node) => node.type === TwoColumnLayout);

      expect(layout.props.detailPane).toBeNull();
    });

    it('renders a loading message when browsing is loading', function() {
      const element = RemovePossessionTabHelper.render(
        buildState({ browse: { items: [], page: 1, pages: 1, loading: true, error: '' } }), buildHandlers()
      );

      expect(JSON.stringify(element)).toContain('Loading possessions...');
    });

    it('renders an empty message when there are no owned possessions', function() {
      const element = RemovePossessionTabHelper.render(buildState(), buildHandlers());

      expect(JSON.stringify(element)).toContain('No possessions available.');
    });

    it('renders a browse error message', function() {
      const state = buildState({
        browse: { items: [], page: 1, pages: 1, loading: false, error: 'possession_exchange_modal.generic_error' },
      });
      const element = RemovePossessionTabHelper.render(state, buildHandlers());

      expect(JSON.stringify(element)).toContain('Unable to complete this action. Please try again.');
    });

    it('renders a list item for each owned possession and wires onSelect', function() {
      const handlers = buildHandlers();
      const item = { id: 3, game_possession_id: 9, name: 'Old Tavern' };
      const state = buildState({ browse: { items: [item], page: 1, pages: 1, loading: false, error: '' } });
      const element = RemovePossessionTabHelper.render(state, handlers);
      const button = findElement(
        element, (child) => child.type === 'button' && child.props.children?.props?.children === 'Old Tavern'
      );

      button.props.onClick();

      expect(handlers.onSelect).toHaveBeenCalledWith(item);
    });

    it('passes the browse state and handlers to BrowsePager', function() {
      const handlers = buildHandlers();
      const browse = { items: [], page: 2, pages: 3, loading: false, error: '' };
      const state = buildState({ browse });
      const element = RemovePossessionTabHelper.render(state, handlers);
      const pager = findElement(element, (child) => child.type === BrowsePager);

      expect(pager.props.browse).toBe(browse);
      expect(pager.props.onPrev).toBe(handlers.onPrev);
      expect(pager.props.onNext).toBe(handlers.onNext);
    });
  });
});
