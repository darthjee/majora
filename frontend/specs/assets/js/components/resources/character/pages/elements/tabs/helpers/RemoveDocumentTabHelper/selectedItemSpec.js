import RemoveDocumentTabHelper
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/helpers/RemoveDocumentTabHelper.jsx';
import CardDocumentImage
  from '../../../../../../../../../../../assets/js/components/common/cards/CardDocumentImage.jsx';
import TwoColumnLayout
  from '../../../../../../../../../../../assets/js/components/common/layout/TwoColumnLayout.jsx';
import { buildHandlers, buildState, findElement } from './support.js';

describe('RemoveDocumentTabHelper', function() {
  describe('.render', function() {
    describe('when a document is selected', function() {
      const selected = { id: 3, game_document_id: 9, name: 'Ancient Map', photo_path: '/map.png' };

      it('renders a two-column layout keeping the browse list visible alongside the detail pane', function() {
        const state = buildState({
          selected, browse: { items: [selected], page: 1, pages: 1, loading: false, error: '' },
        });
        const element = RemoveDocumentTabHelper.render(state, buildHandlers());
        const layout = findElement(element, (node) => node.type === TwoColumnLayout);

        expect(layout.props.detailPane).not.toBeNull();
        expect(JSON.stringify(element)).toContain('Ancient Map');
      });

      it('renders the selected document\'s image and name', function() {
        const state = buildState({ selected });
        const element = RemoveDocumentTabHelper.render(state, buildHandlers());
        const image = findElement(element, (child) => child.type === CardDocumentImage);

        expect(image.props.url).toBe('/map.png');
        expect(image.props.alt).toBe('Ancient Map');
      });

      it('renders no quantity input — documents have no quantity', function() {
        const state = buildState({ selected });
        const element = RemoveDocumentTabHelper.render(state, buildHandlers());

        expect(JSON.stringify(element)).not.toContain('quantity');
      });

      it('renders the action error when present', function() {
        const state = buildState({ selected, actionError: 'document_exchange_modal.generic_error' });
        const element = RemoveDocumentTabHelper.render(state, buildHandlers());

        expect(JSON.stringify(element)).toContain('Unable to complete this action. Please try again.');
      });

      it('disables the confirm button while submitting', function() {
        const state = buildState({ selected, submitting: true });
        const element = RemoveDocumentTabHelper.render(state, buildHandlers());
        const confirmButton = findElement(
          element, (child) => child.type === 'button' && child.props.children === 'Confirm'
        );

        expect(confirmButton.props.disabled).toBe(true);
      });

      it('wires the confirm and cancel button handlers', function() {
        const handlers = buildHandlers();
        const state = buildState({ selected });
        const element = RemoveDocumentTabHelper.render(state, handlers);
        const confirmButton = findElement(
          element, (child) => child.type === 'button' && child.props.children === 'Confirm'
        );
        const cancelButton = findElement(
          element, (child) => child.type === 'button' && child.props.children === 'Cancel'
        );

        expect(confirmButton.props.onClick).toBe(handlers.onConfirm);
        expect(cancelButton.props.onClick).toBe(handlers.onCancel);
      });
    });
  });
});
