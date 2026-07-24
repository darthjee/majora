import DocumentDescriptionField
  from '../../../../../../../../../assets/js/components/resources/document/pages/elements/show/DocumentDescriptionField.jsx';
import MarkdownEditor from '../../../../../../../../../assets/js/components/common/forms/MarkdownEditor.jsx';

describe('DocumentDescriptionField', function() {
  const buildProps = (overrides = {}) => ({
    description: 'A crumbling scroll.',
    fieldErrors: {},
    handlers: { onDescriptionChange: jasmine.createSpy('onDescriptionChange') },
    ...overrides,
  });

  it('renders a MarkdownEditor with the new-mode id', function() {
    const element = DocumentDescriptionField(buildProps());

    expect(element.type).toBe(MarkdownEditor);
    expect(element.props.id).toBe('document-new-description');
    expect(element.props.value).toBe('A crumbling scroll.');
  });

  it('passes field errors through', function() {
    const element = DocumentDescriptionField(buildProps({ fieldErrors: { description: ['is too long'] } }));

    expect(element.props.errors).toEqual(['is too long']);
  });

  it('wires onChange to handlers.onDescriptionChange', function() {
    const handlers = { onDescriptionChange: jasmine.createSpy('onDescriptionChange') };
    const element = DocumentDescriptionField(buildProps({ handlers }));

    expect(element.props.onChange).toBe(handlers.onDescriptionChange);
  });
});
