import AcquirePossessionTabHelper
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/helpers/AcquirePossessionTabHelper.jsx';
import CardPossessionImage
  from '../../../../../../../../../../../assets/js/components/common/cards/CardPossessionImage.jsx';
import TwoColumnLayout
  from '../../../../../../../../../../../assets/js/components/common/layout/TwoColumnLayout.jsx';
import { buildHandlers, buildState, findElement } from './support.js';

describe('AcquirePossessionTabHelper', function() {
  describe('.render', function() {
    describe('when a possession is selected', function() {
      const selected = { id: 9, name: 'Old Tavern', photo_path: '/tavern.png', hidden: false };

      it('renders a two-column layout keeping the browse list visible alongside the detail pane', function() {
        const state = buildState({
          selected, browse: { items: [selected], page: 1, pages: 1, loading: false, error: '' },
        });
        const element = AcquirePossessionTabHelper.render(state, buildHandlers());
        const layout = findElement(element, (node) => node.type === TwoColumnLayout);

        expect(layout.props.detailPane).not.toBeNull();
        expect(JSON.stringify(element)).toContain('Old Tavern');
      });

      it('renders the selected possession\'s image and name', function() {
        const state = buildState({ selected });
        const element = AcquirePossessionTabHelper.render(state, buildHandlers());
        const image = findElement(element, (child) => child.type === CardPossessionImage);

        expect(image.props.url).toBe('/tavern.png');
        expect(image.props.alt).toBe('Old Tavern');
      });

      it('binds the hidden switch to the hidden state and wires onHiddenChange', function() {
        const handlers = buildHandlers();
        const state = buildState({ selected, hidden: true });
        const element = AcquirePossessionTabHelper.render(state, handlers);
        const checkbox = findElement(element, (child) => child.type === 'input' && child.props.type === 'checkbox');

        expect(checkbox.props.checked).toBe(true);

        checkbox.props.onChange({ target: { checked: false } });

        expect(handlers.onHiddenChange).toHaveBeenCalledWith(false);
      });

      it('renders no quantity input — possessions have no quantity', function() {
        const state = buildState({ selected });
        const element = AcquirePossessionTabHelper.render(state, buildHandlers());

        expect(JSON.stringify(element)).not.toContain('quantity');
      });

      it('renders the action error when present', function() {
        const state = buildState({ selected, actionError: 'possession_exchange_modal.already_owned_error' });
        const element = AcquirePossessionTabHelper.render(state, buildHandlers());

        expect(JSON.stringify(element)).toContain('This possession is already owned.');
      });

      it('disables the confirm button while submitting', function() {
        const state = buildState({ selected, submitting: true });
        const element = AcquirePossessionTabHelper.render(state, buildHandlers());
        const confirmButton = findElement(
          element, (child) => child.type === 'button' && child.props.children === 'Confirm'
        );

        expect(confirmButton.props.disabled).toBe(true);
      });

      it('wires the confirm and cancel button handlers', function() {
        const handlers = buildHandlers();
        const state = buildState({ selected });
        const element = AcquirePossessionTabHelper.render(state, handlers);
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
