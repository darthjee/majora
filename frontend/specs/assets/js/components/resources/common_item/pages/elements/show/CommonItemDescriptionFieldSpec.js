import CommonItemDescriptionField
  from '../../../../../../../../../assets/js/components/resources/common_item/pages/elements/show/CommonItemDescriptionField.jsx';
import MarkdownEditor from '../../../../../../../../../assets/js/components/common/forms/MarkdownEditor.jsx';

describe('CommonItemDescriptionField', function() {
  const buildProps = (overrides = {}) => ({
    mode: 'new',
    description: 'Heals wounds.',
    fieldErrors: {},
    handlers: { onDescriptionChange: jasmine.createSpy('onDescriptionChange') },
    ...overrides,
  });

  it('renders a MarkdownEditor with a mode-scoped id in new mode', function() {
    const element = CommonItemDescriptionField(buildProps());

    expect(element.type).toBe(MarkdownEditor);
    expect(element.props.id).toBe('common-item-new-description');
    expect(element.props.value).toBe('Heals wounds.');
  });

  it('scopes the id to edit mode', function() {
    const element = CommonItemDescriptionField(buildProps({ mode: 'edit' }));

    expect(element.props.id).toBe('common-item-edit-description');
  });

  it('passes field errors through', function() {
    const element = CommonItemDescriptionField(buildProps({ fieldErrors: { description: ['is too long'] } }));

    expect(element.props.errors).toEqual(['is too long']);
  });

  it('wires onChange to handlers.onDescriptionChange', function() {
    const handlers = { onDescriptionChange: jasmine.createSpy('onDescriptionChange') };
    const element = CommonItemDescriptionField(buildProps({ handlers }));

    expect(element.props.onChange).toBe(handlers.onDescriptionChange);
  });
});
