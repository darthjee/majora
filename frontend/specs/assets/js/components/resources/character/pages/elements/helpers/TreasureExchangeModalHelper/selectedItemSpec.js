import TreasureExchangeModalHelper
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/TreasureExchangeModalHelper.jsx';
import TreasureMoney from '../../../../../../../../../../assets/js/components/common/TreasureMoney.jsx';
import { buildHandlers, buildState, findElement } from './support.js';

describe('TreasureExchangeModalHelper', function() {
  describe('.render', function() {
    describe('when an item is selected', function() {
      const selected = {
        id: 9, treasure_id: 9, name: 'Golden Crown', value: 500, quantity: 3, photo_path: null,
      };

      it('renders the selected treasure name and value', function() {
        const state = buildState({ selected });
        const element = TreasureExchangeModalHelper.render(true, state, buildHandlers());

        expect(JSON.stringify(element)).toContain('Golden Crown');
      });

      it('renders the already-owned count from ownedByTreasureId on the acquire tab', function() {
        const state = buildState({ activeTab: 'acquire', selected, ownedByTreasureId: { 9: 2 } });
        const element = TreasureExchangeModalHelper.render(true, state, buildHandlers());

        expect(JSON.stringify(element)).toContain('Already owned: 2');
      });

      it('renders the owned quantity from the selected item on the sell tab', function() {
        const state = buildState({ activeTab: 'sell', selected });
        const element = TreasureExchangeModalHelper.render(true, state, buildHandlers());

        expect(JSON.stringify(element)).toContain('Already owned: 3');
      });

      it('wires the quantity input onChange handler', function() {
        const handlers = buildHandlers();
        const state = buildState({ selected });
        const element = TreasureExchangeModalHelper.render(true, state, handlers);
        const input = findElement(element, (child) => child.type === 'input' && child.props.type === 'number');

        input.props.onChange({ target: { value: '4' } });

        expect(handlers.onQuantityChange).toHaveBeenCalledWith(4);
      });

      it('wires the back button to onBack', function() {
        const handlers = buildHandlers();
        const state = buildState({ selected });
        const element = TreasureExchangeModalHelper.render(true, state, handlers);
        const backButton = findElement(
          element, (child) => child.type === 'button' && child.props.children === 'Back'
        );

        backButton.props.onClick();

        expect(handlers.onBack).toHaveBeenCalled();
      });

      it('wires the confirm button to onConfirm and disables it while submitting', function() {
        const handlers = buildHandlers();
        const state = buildState({ selected, submitting: true });
        const element = TreasureExchangeModalHelper.render(true, state, handlers);
        const confirmButton = findElement(
          element, (child) => child.type === 'button' && child.props.children === 'Confirm'
        );

        confirmButton.props.onClick();

        expect(handlers.onConfirm).toHaveBeenCalled();
        expect(confirmButton.props.disabled).toBe(true);
      });

      it('renders the action error when present', function() {
        const state = buildState({ selected, actionError: 'treasure_exchange_modal.insufficient_funds' });
        const element = TreasureExchangeModalHelper.render(true, state, buildHandlers());

        expect(JSON.stringify(element)).toContain('Not enough money to acquire this quantity.');
      });

      it('does not render an action error when absent', function() {
        const state = buildState({ selected, actionError: '' });
        const element = TreasureExchangeModalHelper.render(true, state, buildHandlers());

        expect(JSON.stringify(element)).not.toContain('alert-danger');
      });

      it('renders the selected treasure value using the given gameType', function() {
        const state = buildState({ selected: { ...selected, value: 350 }, gameType: 'deadlands' });
        const element = TreasureExchangeModalHelper.render(true, state, buildHandlers());
        const moneyElement = findElement(element, (child) => child.type === TreasureMoney);

        expect(moneyElement.props.value).toBe(350);
        expect(moneyElement.props.gameType).toBe('deadlands');
      });
    });
  });
});
