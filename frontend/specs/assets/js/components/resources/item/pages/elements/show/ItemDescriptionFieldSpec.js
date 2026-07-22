import ItemDescriptionField
  from '../../../../../../../../../assets/js/components/resources/item/pages/elements/show/ItemDescriptionField.jsx';
import TextareaField from '../../../../../../../../../assets/js/components/common/forms/TextareaField.jsx';

describe('ItemDescriptionField', function() {
  const buildProps = (overrides = {}) => ({
    mode: 'new',
    description: 'A cloak that grants stealth.',
    fieldErrors: {},
    handlers: { onDescriptionChange: jasmine.createSpy('onDescriptionChange') },
    ...overrides,
  });

  it('renders a TextareaField with a mode-scoped id in new mode', function() {
    const element = ItemDescriptionField(buildProps());

    expect(element.type).toBe(TextareaField);
    expect(element.props.id).toBe('character-item-new-description');
    expect(element.props.value).toBe('A cloak that grants stealth.');
  });

  it('scopes the id to edit mode', function() {
    const element = ItemDescriptionField(buildProps({ mode: 'edit' }));

    expect(element.props.id).toBe('item-edit-description');
  });

  it('passes field errors through', function() {
    const element = ItemDescriptionField(buildProps({ fieldErrors: { description: ['is too long'] } }));

    expect(element.props.errors).toEqual(['is too long']);
  });

  it('wires onChange to handlers.onDescriptionChange', function() {
    const handlers = { onDescriptionChange: jasmine.createSpy('onDescriptionChange') };
    const element = ItemDescriptionField(buildProps({ handlers }));

    expect(element.props.onChange).toBe(handlers.onDescriptionChange);
  });
});
