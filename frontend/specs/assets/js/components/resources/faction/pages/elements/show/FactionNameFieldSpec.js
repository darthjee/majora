import FactionNameField
  from '../../../../../../../../../assets/js/components/resources/faction/pages/elements/show/FactionNameField.jsx';
import FormField from '../../../../../../../../../assets/js/components/common/forms/FormField.jsx';

describe('FactionNameField', function() {
  const buildProps = (overrides = {}) => ({
    name: 'The Silver Hand',
    fieldErrors: {},
    handlers: { onNameChange: jasmine.createSpy('onNameChange') },
    ...overrides,
  });

  it('renders a FormField seeded with the name value', function() {
    const element = FactionNameField(buildProps());

    expect(element.type).toBe(FormField);
    expect(element.props.id).toBe('faction-edit-name');
    expect(element.props.value).toBe('The Silver Hand');
  });

  it('passes field errors through', function() {
    const element = FactionNameField(buildProps({ fieldErrors: { name: ['is too short'] } }));

    expect(element.props.errors).toEqual(['is too short']);
  });

  it('defaults errors to an empty array when no field error is present', function() {
    const element = FactionNameField(buildProps());

    expect(element.props.errors).toEqual([]);
  });

  it('wires onChange to handlers.onNameChange', function() {
    const handlers = { onNameChange: jasmine.createSpy('onNameChange') };
    const element = FactionNameField(buildProps({ handlers }));

    expect(element.props.onChange).toBe(handlers.onNameChange);
  });
});
