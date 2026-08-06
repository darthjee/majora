import { renderToStaticMarkup } from 'react-dom/server';
import TreasureReceivingRowHelper
  from '../../../../../../../../../assets/js/components/resources/treasure/pages/elements/helpers/TreasureReceivingRowHelper.jsx';
import { findButtonWithIcon } from './support.js';

describe('TreasureReceivingRowHelper', function() {
  describe('.render', function() {
    const buildRow = (overrides = {}) => ({
      character: { id: 1, name: 'Aria' },
      kind: 'pcs',
      ownedQuantity: 2,
      pendingQuantity: 3,
      result: null,
      partialNotice: '',
      ...overrides,
    });

    const buildHandlers = () => ({
      onIncrement: jasmine.createSpy('onIncrement'),
      onDecrement: jasmine.createSpy('onDecrement'),
      onRemove: jasmine.createSpy('onRemove'),
    });

    it('renders the character name', function() {
      const html = renderToStaticMarkup(TreasureReceivingRowHelper.render(buildRow(), buildHandlers()));

      expect(html).toContain('Aria');
    });

    it('renders the pc badge for a pc row', function() {
      const html = renderToStaticMarkup(TreasureReceivingRowHelper.render(buildRow({ kind: 'pcs' }), buildHandlers()));

      expect(html).toContain('PCs');
    });

    it('renders the npc badge for an npc row', function() {
      const html = renderToStaticMarkup(TreasureReceivingRowHelper.render(buildRow({ kind: 'npcs' }), buildHandlers()));

      expect(html).toContain('NPCs');
    });

    it('renders the owned and pending quantities', function() {
      const html = renderToStaticMarkup(
        TreasureReceivingRowHelper.render(buildRow({ ownedQuantity: 2, pendingQuantity: 3 }), buildHandlers()),
      );

      expect(html).toContain('>2<');
      expect(html).toContain('>3<');
    });

    it('renders the increment/decrement/remove icons', function() {
      const html = renderToStaticMarkup(TreasureReceivingRowHelper.render(buildRow(), buildHandlers()));

      expect(html).toContain('bi-caret-up-square-fill');
      expect(html).toContain('bi-caret-down-square-fill');
      expect(html).toContain('bi-person-x');
    });

    it('does not render a result message when result is null', function() {
      const html = renderToStaticMarkup(TreasureReceivingRowHelper.render(buildRow({ result: null }), buildHandlers()));

      expect(html).not.toContain('text-success');
      expect(html).not.toContain('text-danger');
      expect(html).not.toContain('text-warning');
    });

    it('renders the success result message when fully fulfilled', function() {
      const html = renderToStaticMarkup(
        TreasureReceivingRowHelper.render(buildRow({ result: 'success', partialNotice: '' }), buildHandlers()),
      );

      expect(html).toContain('text-success');
      expect(html).toContain('Treasure given to Aria.');
    });

    it('renders the failure result message', function() {
      const html = renderToStaticMarkup(TreasureReceivingRowHelper.render(buildRow({ result: 'failure' }), buildHandlers()));

      expect(html).toContain('text-danger');
      expect(html).toContain('Unable to give treasure to Aria.');
    });

    it('renders the partial-fulfillment notice instead of the success message when present', function() {
      const notice = 'Only 1 of 3 were available and were given to Aria.';
      const html = renderToStaticMarkup(
        TreasureReceivingRowHelper.render(buildRow({ result: 'success', partialNotice: notice }), buildHandlers()),
      );

      expect(html).toContain('text-warning');
      expect(html).toContain(notice);
      expect(html).not.toContain('Treasure given to Aria.');
    });

    it('renders the failure message rather than any partial notice when the request failed outright', function() {
      const html = renderToStaticMarkup(
        TreasureReceivingRowHelper.render(
          buildRow({ result: 'failure', partialNotice: 'should not matter' }), buildHandlers(),
        ),
      );

      expect(html).toContain('Unable to give treasure to Aria.');
      expect(html).not.toContain('should not matter');
    });

    it('calls onIncrement with the row kind/id when the increment icon is clicked', function() {
      const handlers = buildHandlers();
      const element = TreasureReceivingRowHelper.render(buildRow(), handlers);
      const incrementButton = findButtonWithIcon(element, 'bi-caret-up-square-fill');

      incrementButton.props.onClick();

      expect(handlers.onIncrement).toHaveBeenCalledWith('pcs', 1);
    });

    it('calls onDecrement with the row kind/id when the decrement icon is clicked', function() {
      const handlers = buildHandlers();
      const element = TreasureReceivingRowHelper.render(buildRow(), handlers);
      const decrementButton = findButtonWithIcon(element, 'bi-caret-down-square-fill');

      decrementButton.props.onClick();

      expect(handlers.onDecrement).toHaveBeenCalledWith('pcs', 1);
    });

    it('calls onRemove with the row kind/id when the remove icon is clicked', function() {
      const handlers = buildHandlers();
      const element = TreasureReceivingRowHelper.render(buildRow(), handlers);
      const removeButton = findButtonWithIcon(element, 'bi-person-x');

      removeButton.props.onClick();

      expect(handlers.onRemove).toHaveBeenCalledWith('pcs', 1);
    });
  });
});
