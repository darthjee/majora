import GameDescriptionField
  from '../../../../../../../../../assets/js/components/resources/game/pages/elements/show/GameDescriptionField.jsx';
import TextareaField from '../../../../../../../../../assets/js/components/common/forms/TextareaField.jsx';

describe('GameDescriptionField', function() {
  const buildProps = (overrides = {}) => ({
    mode: 'new',
    description: 'An adventure.',
    fieldErrors: {},
    handlers: { onDescriptionChange: jasmine.createSpy('onDescriptionChange') },
    ...overrides,
  });

  it('renders a TextareaField with a mode-scoped id', function() {
    const element = GameDescriptionField(buildProps());

    expect(element.type).toBe(TextareaField);
    expect(element.props.id).toBe('game-new-description');
    expect(element.props.value).toBe('An adventure.');
  });

  it('scopes the id to edit mode', function() {
    const element = GameDescriptionField(buildProps({ mode: 'edit' }));

    expect(element.props.id).toBe('game-edit-description');
  });

  it('passes field errors through', function() {
    const element = GameDescriptionField(buildProps({ fieldErrors: { description: ['too long'] } }));

    expect(element.props.errors).toEqual(['too long']);
  });

  it('wires onChange to handlers.onDescriptionChange', function() {
    const handlers = { onDescriptionChange: jasmine.createSpy('onDescriptionChange') };
    const element = GameDescriptionField(buildProps({ handlers }));

    expect(element.props.onChange).toBe(handlers.onDescriptionChange);
  });
});
