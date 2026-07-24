import RemoveItemTabHelper
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/helpers/RemoveItemTabHelper.jsx';
import CardItemImage
  from '../../../../../../../../../../../assets/js/components/common/cards/CardItemImage.jsx';
import { buildHandlers, buildState, findElement } from './support.js';

describe('RemoveItemTabHelper', function() {
  describe('.render', function() {
    describe('when an item is selected', function() {
      const selected = { id: 3, game_item_id: 9, name: 'Sting', photo_path: '/sting.png' };

      it('renders a two-column layout keeping the browse list visible alongside the detail pane', function() {
        const state = buildState({
          selected, browse: { items: [selected], page: 1, pages: 1, loading: false, error: '' },
        });
        const element = RemoveItemTabHelper.render(state, buildHandlers());

        expect(JSON.stringify(element)).toContain('row');
        expect(JSON.stringify(element)).toContain('Sting');
      });

      it('renders the selected item\'s image and name', function() {
        const state = buildState({ selected });
        const element = RemoveItemTabHelper.render(state, buildHandlers());
        const image = findElement(element, (child) => child.type === CardItemImage);

        expect(image.props.url).toBe('/sting.png');
        expect(image.props.alt).toBe('Sting');
      });

      it('renders no quantity input — items have no quantity', function() {
        const state = buildState({ selected });
        const element = RemoveItemTabHelper.render(state, buildHandlers());

        expect(JSON.stringify(element)).not.toContain('quantity');
      });

      it('renders the action error when present', function() {
        const state = buildState({ selected, actionError: 'item_exchange_modal.generic_error' });
        const element = RemoveItemTabHelper.render(state, buildHandlers());

        expect(JSON.stringify(element)).toContain('Unable to complete this action. Please try again.');
      });

      it('disables the confirm button while submitting', function() {
        const state = buildState({ selected, submitting: true });
        const element = RemoveItemTabHelper.render(state, buildHandlers());
        const confirmButton = findElement(
          element, (child) => child.type === 'button' && child.props.children === 'Confirm'
        );

        expect(confirmButton.props.disabled).toBe(true);
      });

      it('wires the confirm and cancel button handlers', function() {
        const handlers = buildHandlers();
        const state = buildState({ selected });
        const element = RemoveItemTabHelper.render(state, handlers);
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
