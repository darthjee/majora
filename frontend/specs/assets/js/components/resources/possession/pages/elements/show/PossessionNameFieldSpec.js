import PossessionNameField
  from '../../../../../../../../../assets/js/components/resources/possession/pages/elements/show/PossessionNameField.jsx';
import FormField from '../../../../../../../../../assets/js/components/common/forms/FormField.jsx';

describe('PossessionNameField', function() {
  const buildProps = (overrides = {}) => ({
    mode: 'new',
    name: 'Old Tavern',
    fieldErrors: {},
    handlers: { onNameChange: jasmine.createSpy('onNameChange') },
    ...overrides,
  });

  it('renders a FormField with a mode-scoped id in new mode', function() {
    const element = PossessionNameField(buildProps());

    expect(element.type).toBe(FormField);
    expect(element.props.id).toBe('possession-new-name');
    expect(element.props.value).toBe('Old Tavern');
  });

  it('scopes the id to edit mode', function() {
    const element = PossessionNameField(buildProps({ mode: 'edit' }));

    expect(element.props.id).toBe('possession-edit-name');
  });

  it('passes field errors through', function() {
    const element = PossessionNameField(buildProps({ fieldErrors: { name: ['is too short'] } }));

    expect(element.props.errors).toEqual(['is too short']);
  });

  it('wires onChange to handlers.onNameChange', function() {
    const handlers = { onNameChange: jasmine.createSpy('onNameChange') };
    const element = PossessionNameField(buildProps({ handlers }));

    expect(element.props.onChange).toBe(handlers.onNameChange);
  });
});
