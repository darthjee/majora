import TreasureNameField
  from '../../../../../../../../../assets/js/components/resources/treasure/pages/elements/show/TreasureNameField.jsx';
import FormField from '../../../../../../../../../assets/js/components/common/forms/FormField.jsx';

describe('TreasureNameField', function() {
  const buildProps = (overrides = {}) => ({
    mode: 'new',
    name: 'Golden Crown',
    fieldErrors: {},
    handlers: { onNameChange: jasmine.createSpy('onNameChange') },
    ...overrides,
  });

  it('renders a FormField with a mode-scoped id in new mode', function() {
    const element = TreasureNameField(buildProps());

    expect(element.type).toBe(FormField);
    expect(element.props.id).toBe('game-treasure-new-name');
    expect(element.props.value).toBe('Golden Crown');
  });

  it('scopes the id to edit mode', function() {
    const element = TreasureNameField(buildProps({ mode: 'edit' }));

    expect(element.props.id).toBe('game-treasure-edit-name');
  });

  it('passes field errors through', function() {
    const element = TreasureNameField(buildProps({ fieldErrors: { name: ['is required'] } }));

    expect(element.props.errors).toEqual(['is required']);
  });

  it('wires onChange to handlers.onNameChange', function() {
    const handlers = { onNameChange: jasmine.createSpy('onNameChange') };
    const element = TreasureNameField(buildProps({ handlers }));

    expect(element.props.onChange).toBe(handlers.onNameChange);
  });
});
