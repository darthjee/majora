import TreasureMaxUnitsField
  from '../../../../../../../../../assets/js/components/resources/treasure/pages/elements/show/TreasureMaxUnitsField.jsx';
import FormField from '../../../../../../../../../assets/js/components/common/forms/FormField.jsx';

describe('TreasureMaxUnitsField', function() {
  const buildProps = (overrides = {}) => ({
    maxUnits: '10',
    isExclusive: false,
    fieldErrors: {},
    handlers: { onMaxUnitsChange: jasmine.createSpy('onMaxUnitsChange') },
    ...overrides,
  });

  it('renders a FormField with the fixed edit-mode id', function() {
    const element = TreasureMaxUnitsField(buildProps());

    expect(element.type).toBe(FormField);
    expect(element.props.id).toBe('game-treasure-edit-max-units');
    expect(element.props.value).toBe('10');
  });

  it('renders nothing when the treasure is exclusive to the game', function() {
    const element = TreasureMaxUnitsField(buildProps({ isExclusive: true }));

    expect(element).toBeNull();
  });

  it('renders when the treasure is linked (not exclusive)', function() {
    const element = TreasureMaxUnitsField(buildProps({ isExclusive: false }));

    expect(element).not.toBeNull();
  });

  it('passes field errors through', function() {
    const element = TreasureMaxUnitsField(buildProps({ fieldErrors: { max_units: ['is invalid'] } }));

    expect(element.props.errors).toEqual(['is invalid']);
  });

  it('wires onChange to handlers.onMaxUnitsChange', function() {
    const handlers = { onMaxUnitsChange: jasmine.createSpy('onMaxUnitsChange') };
    const element = TreasureMaxUnitsField(buildProps({ handlers }));

    expect(element.props.onChange).toBe(handlers.onMaxUnitsChange);
  });
});
