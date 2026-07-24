import DocumentNameField
  from '../../../../../../../../../assets/js/components/resources/document/pages/elements/show/DocumentNameField.jsx';
import FormField from '../../../../../../../../../assets/js/components/common/forms/FormField.jsx';

describe('DocumentNameField', function() {
  const buildProps = (overrides = {}) => ({
    name: 'Ancient Scroll',
    fieldErrors: {},
    handlers: { onNameChange: jasmine.createSpy('onNameChange') },
    ...overrides,
  });

  it('renders a FormField with the new-mode id', function() {
    const element = DocumentNameField(buildProps());

    expect(element.type).toBe(FormField);
    expect(element.props.id).toBe('document-new-name');
    expect(element.props.value).toBe('Ancient Scroll');
  });

  it('passes field errors through', function() {
    const element = DocumentNameField(buildProps({ fieldErrors: { name: ['is too short'] } }));

    expect(element.props.errors).toEqual(['is too short']);
  });

  it('wires onChange to handlers.onNameChange', function() {
    const handlers = { onNameChange: jasmine.createSpy('onNameChange') };
    const element = DocumentNameField(buildProps({ handlers }));

    expect(element.props.onChange).toBe(handlers.onNameChange);
  });
});
