import GameNameField
  from '../../../../../../../../../assets/js/components/resources/game/pages/elements/show/GameNameField.jsx';
import FormField from '../../../../../../../../../assets/js/components/common/forms/FormField.jsx';

describe('GameNameField', function() {
  const buildProps = (overrides = {}) => ({
    mode: 'new',
    name: 'Epic Quest',
    fieldErrors: {},
    handlers: { onNameChange: jasmine.createSpy('onNameChange') },
    ...overrides,
  });

  it('renders a FormField with a mode-scoped id', function() {
    const element = GameNameField(buildProps());

    expect(element.type).toBe(FormField);
    expect(element.props.id).toBe('game-new-name');
    expect(element.props.value).toBe('Epic Quest');
  });

  it('scopes the id to edit mode', function() {
    const element = GameNameField(buildProps({ mode: 'edit' }));

    expect(element.props.id).toBe('game-edit-name');
  });

  it('passes field errors through', function() {
    const element = GameNameField(buildProps({ fieldErrors: { name: ['is too short'] } }));

    expect(element.props.errors).toEqual(['is too short']);
  });

  it('wires onChange to handlers.onNameChange', function() {
    const handlers = { onNameChange: jasmine.createSpy('onNameChange') };
    const element = GameNameField(buildProps({ handlers }));

    expect(element.props.onChange).toBe(handlers.onNameChange);
  });
});
