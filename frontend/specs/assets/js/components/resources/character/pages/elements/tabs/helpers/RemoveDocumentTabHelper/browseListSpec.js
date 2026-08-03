import RemoveDocumentTabHelper
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/helpers/RemoveDocumentTabHelper.jsx';
import BrowsePager
  from '../../../../../../../../../../../assets/js/components/common/pagination/BrowsePager.jsx';
import { buildHandlers, buildState, findElement } from './support.js';

describe('RemoveDocumentTabHelper', function() {
  describe('.render', function() {
    it('renders a loading message when browsing is loading', function() {
      const element = RemoveDocumentTabHelper.render(
        buildState({ browse: { items: [], page: 1, pages: 1, loading: true, error: '' } }), buildHandlers()
      );

      expect(JSON.stringify(element)).toContain('Loading documents...');
    });

    it('renders an empty message when there are no owned documents', function() {
      const element = RemoveDocumentTabHelper.render(buildState(), buildHandlers());

      expect(JSON.stringify(element)).toContain('No documents available.');
    });

    it('renders a browse error message', function() {
      const state = buildState({
        browse: { items: [], page: 1, pages: 1, loading: false, error: 'document_exchange_modal.generic_error' },
      });
      const element = RemoveDocumentTabHelper.render(state, buildHandlers());

      expect(JSON.stringify(element)).toContain('Unable to complete this action. Please try again.');
    });

    it('renders a list item for each owned document and wires onSelect', function() {
      const handlers = buildHandlers();
      const item = { id: 3, game_document_id: 9, name: 'Ancient Map' };
      const state = buildState({ browse: { items: [item], page: 1, pages: 1, loading: false, error: '' } });
      const element = RemoveDocumentTabHelper.render(state, handlers);
      const button = findElement(
        element, (child) => child.type === 'button' && child.props.children?.props?.children === 'Ancient Map'
      );

      button.props.onClick();

      expect(handlers.onSelect).toHaveBeenCalledWith(item);
    });

    it('passes the browse state and handlers to BrowsePager', function() {
      const handlers = buildHandlers();
      const browse = { items: [], page: 2, pages: 3, loading: false, error: '' };
      const state = buildState({ browse });
      const element = RemoveDocumentTabHelper.render(state, handlers);
      const pager = findElement(element, (child) => child.type === BrowsePager);

      expect(pager.props.browse).toBe(browse);
      expect(pager.props.onPrev).toBe(handlers.onPrev);
      expect(pager.props.onNext).toBe(handlers.onNext);
    });
  });
});
