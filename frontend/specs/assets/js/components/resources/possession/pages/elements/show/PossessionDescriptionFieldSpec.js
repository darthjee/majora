import PossessionDescriptionField
  from '../../../../../../../../../assets/js/components/resources/possession/pages/elements/show/PossessionDescriptionField.jsx';
import MarkdownEditor from '../../../../../../../../../assets/js/components/common/forms/MarkdownEditor.jsx';

describe('PossessionDescriptionField', function() {
  const buildProps = (overrides = {}) => ({
    mode: 'new',
    description: 'A cozy roadside tavern.',
    fieldErrors: {},
    handlers: { onDescriptionChange: jasmine.createSpy('onDescriptionChange') },
    ...overrides,
  });

  it('renders a MarkdownEditor with a mode-scoped id in new mode', function() {
    const element = PossessionDescriptionField(buildProps());

    expect(element.type).toBe(MarkdownEditor);
    expect(element.props.id).toBe('possession-new-description');
    expect(element.props.value).toBe('A cozy roadside tavern.');
  });

  it('scopes the id to edit mode', function() {
    const element = PossessionDescriptionField(buildProps({ mode: 'edit' }));

    expect(element.props.id).toBe('possession-edit-description');
  });

  it('passes field errors through', function() {
    const element = PossessionDescriptionField(buildProps({ fieldErrors: { description: ['is too long'] } }));

    expect(element.props.errors).toEqual(['is too long']);
  });

  it('wires onChange to handlers.onDescriptionChange', function() {
    const handlers = { onDescriptionChange: jasmine.createSpy('onDescriptionChange') };
    const element = PossessionDescriptionField(buildProps({ handlers }));

    expect(element.props.onChange).toBe(handlers.onDescriptionChange);
  });
});
