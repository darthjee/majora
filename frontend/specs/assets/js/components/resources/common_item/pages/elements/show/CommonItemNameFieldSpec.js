import CommonItemNameField
  from '../../../../../../../../../assets/js/components/resources/common_item/pages/elements/show/CommonItemNameField.jsx';
import FormField from '../../../../../../../../../assets/js/components/common/forms/FormField.jsx';

describe('CommonItemNameField', function() {
  const buildProps = (overrides = {}) => ({
    mode: 'new',
    name: 'Healing Potion',
    fieldErrors: {},
    handlers: { onNameChange: jasmine.createSpy('onNameChange') },
    ...overrides,
  });

  it('renders a FormField with a mode-scoped id in new mode', function() {
    const element = CommonItemNameField(buildProps());

    expect(element.type).toBe(FormField);
    expect(element.props.id).toBe('common-item-new-name');
    expect(element.props.value).toBe('Healing Potion');
  });

  it('scopes the id to edit mode', function() {
    const element = CommonItemNameField(buildProps({ mode: 'edit' }));

    expect(element.props.id).toBe('common-item-edit-name');
  });

  it('passes field errors through', function() {
    const element = CommonItemNameField(buildProps({ fieldErrors: { name: ['is too short'] } }));

    expect(element.props.errors).toEqual(['is too short']);
  });

  it('wires onChange to handlers.onNameChange', function() {
    const handlers = { onNameChange: jasmine.createSpy('onNameChange') };
    const element = CommonItemNameField(buildProps({ handlers }));

    expect(element.props.onChange).toBe(handlers.onNameChange);
  });
});
