import AcquireTreasureTabHelper
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/helpers/AcquireTreasureTabHelper.jsx';
import ExchangeDetailPane
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/shared/ExchangeDetailPane.jsx';
import { buildHandlers, buildState, findElement } from './support.js';

describe('AcquireTreasureTabHelper', function() {
  describe('.render', function() {
    describe('when an item is selected', function() {
      const selected = {
        id: 9, name: 'Golden Crown', value: 500, photo_path: null,
      };

      it('renders a two-column layout keeping the browse list visible alongside the detail pane', function() {
        const state = buildState({ selected, browse: { items: [selected], page: 1, pages: 1, loading: false, error: '' } });
        const element = AcquireTreasureTabHelper.render(state, buildHandlers());

        expect(JSON.stringify(element)).toContain('row');
        expect(JSON.stringify(element)).toContain('Golden Crown');
      });

      it('resolves owned from ownedByTreasureId, defaulting to 0', function() {
        const state = buildState({ selected, ownedByTreasureId: { 9: 2 } });
        const element = AcquireTreasureTabHelper.render(state, buildHandlers());
        const pane = findElement(element, (child) => child.type === ExchangeDetailPane);

        expect(pane.props.owned).toBe(2);
      });

      it('defaults owned to 0 when not present in ownedByTreasureId', function() {
        const state = buildState({ selected, ownedByTreasureId: {} });
        const element = AcquireTreasureTabHelper.render(state, buildHandlers());
        const pane = findElement(element, (child) => child.type === ExchangeDetailPane);

        expect(pane.props.owned).toBe(0);
      });

      it('passes no maxQuantity (unbounded besides affordability)', function() {
        const state = buildState({ selected });
        const element = AcquireTreasureTabHelper.render(state, buildHandlers());
        const pane = findElement(element, (child) => child.type === ExchangeDetailPane);

        expect(pane.props.maxQuantity).toBeUndefined();
      });

      it('wires the detail pane handlers through', function() {
        const handlers = buildHandlers();
        const state = buildState({ selected, quantity: 3, submitting: true, actionError: 'err', gameType: 'deadlands' });
        const element = AcquireTreasureTabHelper.render(state, handlers);
        const pane = findElement(element, (child) => child.type === ExchangeDetailPane);

        expect(pane.props.selected).toBe(selected);
        expect(pane.props.quantity).toBe(3);
        expect(pane.props.submitting).toBe(true);
        expect(pane.props.actionError).toBe('err');
        expect(pane.props.gameType).toBe('deadlands');
        expect(pane.props.onQuantityChange).toBe(handlers.onQuantityChange);
        expect(pane.props.onConfirm).toBe(handlers.onConfirm);
        expect(pane.props.onCancel).toBe(handlers.onCancel);
      });
    });
  });
});
