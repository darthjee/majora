import { renderToStaticMarkup } from 'react-dom/server';
import ReceivingRowHelper
  from '../../../../../../../../../assets/js/components/resources/item/pages/elements/helpers/ReceivingRowHelper.jsx';
import { findButtonWithIcon } from './support.js';

describe('ReceivingRowHelper', function() {
  describe('.render', function() {
    const buildRow = (overrides = {}) => ({
      character: { id: 1, name: 'Aria' },
      kind: 'pcs',
      ownedQuantity: 2,
      pendingQuantity: 3,
      result: null,
      ...overrides,
    });

    const buildHandlers = () => ({
      onIncrement: jasmine.createSpy('onIncrement'),
      onDecrement: jasmine.createSpy('onDecrement'),
      onRemove: jasmine.createSpy('onRemove'),
    });

    it('renders the character name', function() {
      const html = renderToStaticMarkup(ReceivingRowHelper.render(buildRow(), buildHandlers()));

      expect(html).toContain('Aria');
    });

    it('renders the pc badge for a pc row', function() {
      const html = renderToStaticMarkup(ReceivingRowHelper.render(buildRow({ kind: 'pcs' }), buildHandlers()));

      expect(html).toContain('PCs');
    });

    it('renders the npc badge for an npc row', function() {
      const html = renderToStaticMarkup(ReceivingRowHelper.render(buildRow({ kind: 'npcs' }), buildHandlers()));

      expect(html).toContain('NPCs');
    });

    it('renders the owned and pending quantities', function() {
      const html = renderToStaticMarkup(
        ReceivingRowHelper.render(buildRow({ ownedQuantity: 2, pendingQuantity: 3 }), buildHandlers()),
      );

      expect(html).toContain('>2<');
      expect(html).toContain('>3<');
    });

    it('renders the increment/decrement/remove icons', function() {
      const html = renderToStaticMarkup(ReceivingRowHelper.render(buildRow(), buildHandlers()));

      expect(html).toContain('bi-caret-up-square-fill');
      expect(html).toContain('bi-caret-down-square-fill');
      expect(html).toContain('bi-person-x');
    });

    it('does not render a result message when result is null', function() {
      const html = renderToStaticMarkup(ReceivingRowHelper.render(buildRow({ result: null }), buildHandlers()));

      expect(html).not.toContain('text-success');
      expect(html).not.toContain('text-danger');
    });

    it('renders the success result message', function() {
      const html = renderToStaticMarkup(ReceivingRowHelper.render(buildRow({ result: 'success' }), buildHandlers()));

      expect(html).toContain('text-success');
      expect(html).toContain('Item given to Aria.');
    });

    it('renders the failure result message', function() {
      const html = renderToStaticMarkup(ReceivingRowHelper.render(buildRow({ result: 'failure' }), buildHandlers()));

      expect(html).toContain('text-danger');
      expect(html).toContain('Unable to give item to Aria.');
    });

    it('calls onIncrement with the row kind/id when the increment icon is clicked', function() {
      const handlers = buildHandlers();
      const element = ReceivingRowHelper.render(buildRow(), handlers);
      const incrementButton = findButtonWithIcon(element, 'bi-caret-up-square-fill');

      incrementButton.props.onClick();

      expect(handlers.onIncrement).toHaveBeenCalledWith('pcs', 1);
    });

    it('calls onDecrement with the row kind/id when the decrement icon is clicked', function() {
      const handlers = buildHandlers();
      const element = ReceivingRowHelper.render(buildRow(), handlers);
      const decrementButton = findButtonWithIcon(element, 'bi-caret-down-square-fill');

      decrementButton.props.onClick();

      expect(handlers.onDecrement).toHaveBeenCalledWith('pcs', 1);
    });

    it('calls onRemove with the row kind/id when the remove icon is clicked', function() {
      const handlers = buildHandlers();
      const element = ReceivingRowHelper.render(buildRow(), handlers);
      const removeButton = findButtonWithIcon(element, 'bi-person-x');

      removeButton.props.onClick();

      expect(handlers.onRemove).toHaveBeenCalledWith('pcs', 1);
    });
  });
});
