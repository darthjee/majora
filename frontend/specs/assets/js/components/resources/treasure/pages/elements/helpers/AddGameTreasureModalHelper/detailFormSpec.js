import AddGameTreasureModalHelper
  from '../../../../../../../../../../assets/js/components/resources/treasure/pages/elements/helpers/AddGameTreasureModalHelper.jsx';
import TreasureMoney from '../../../../../../../../../../assets/js/components/common/misc/TreasureMoney.jsx';
import { buildHandlers, buildState, findElement } from './support.js';

describe('AddGameTreasureModalHelper', function() {
  describe('.render (selected item detail/form)', function() {
    const selected = {
      id: 9, name: 'Golden Crown', value: 500, photo_path: null, game_type: 'dnd',
    };

    it('renders the selected treasure name and value', function() {
      const state = buildState({ selected });
      const element = AddGameTreasureModalHelper.render(true, state, buildHandlers());

      expect(JSON.stringify(element)).toContain('Golden Crown');
    });

    it('renders the selected treasure value using its own gameType', function() {
      const state = buildState({ selected: { ...selected, value: 350, game_type: 'deadlands' } });
      const element = AddGameTreasureModalHelper.render(true, state, buildHandlers());
      const moneyElement = findElement(element, (child) => child.type === TreasureMoney);

      expect(moneyElement.props.value).toBe(350);
      expect(moneyElement.props.gameType).toBe('deadlands');
    });

    it('wires the back button to onBack', function() {
      const handlers = buildHandlers();
      const state = buildState({ selected });
      const element = AddGameTreasureModalHelper.render(true, state, handlers);
      const backButton = findElement(
        element, (child) => child.type === 'button' && child.props.children === 'Back'
      );

      backButton.props.onClick();

      expect(handlers.onBack).toHaveBeenCalled();
    });

    it('wires the value input onChange handler', function() {
      const handlers = buildHandlers();
      const state = buildState({ selected, formState: { value: 500, hidden: false, hasMaxUnits: false, maxUnits: '' } });
      const element = AddGameTreasureModalHelper.render(true, state, handlers);
      const input = findElement(
        element, (child) => child.type === 'input' && child.props.id === 'add-game-treasure-value'
      );

      input.props.onChange({ target: { value: '600' } });

      expect(handlers.onValueChange).toHaveBeenCalledWith('600');
    });

    it('wires the hidden switch onChange handler', function() {
      const handlers = buildHandlers();
      const state = buildState({ selected });
      const element = AddGameTreasureModalHelper.render(true, state, handlers);
      const input = findElement(
        element, (child) => child.type === 'input' && child.props.id === 'add-game-treasure-hidden'
      );

      input.props.onChange({ target: { checked: true } });

      expect(handlers.onHiddenChange).toHaveBeenCalledWith(true);
    });

    it('does not render the max_units input when the switch is off', function() {
      const state = buildState({ selected });
      const element = AddGameTreasureModalHelper.render(true, state, buildHandlers());

      expect(JSON.stringify(element)).not.toContain('add-game-treasure-max-units');
    });

    it('wires the max_units switch onChange handler', function() {
      const handlers = buildHandlers();
      const state = buildState({ selected });
      const element = AddGameTreasureModalHelper.render(true, state, handlers);
      const input = findElement(
        element, (child) => child.type === 'input' && child.props.id === 'add-game-treasure-has-max-units'
      );

      input.props.onChange({ target: { checked: true } });

      expect(handlers.onHasMaxUnitsChange).toHaveBeenCalledWith(true);
    });

    it('renders and wires the max_units input when the switch is on', function() {
      const handlers = buildHandlers();
      const state = buildState({
        selected,
        formState: {
          value: 500, hidden: false, hasMaxUnits: true, maxUnits: '10',
        },
      });
      const element = AddGameTreasureModalHelper.render(true, state, handlers);
      const input = findElement(
        element, (child) => child.type === 'input' && child.props.id === 'add-game-treasure-max-units'
      );

      expect(input.props.value).toBe('10');

      input.props.onChange({ target: { value: '20' } });

      expect(handlers.onMaxUnitsChange).toHaveBeenCalledWith('20');
    });

    it('wires the Save button to onSubmit and disables it while submitting', function() {
      const handlers = buildHandlers();
      const state = buildState({ selected, submitting: true });
      const element = AddGameTreasureModalHelper.render(true, state, handlers);
      const saveButton = findElement(
        element, (child) => child.type === 'button' && child.props.children === 'Save'
      );

      saveButton.props.onClick();

      expect(handlers.onSubmit).toHaveBeenCalled();
      expect(saveButton.props.disabled).toBe(true);
    });
  });
});
