import TreasureValueFieldSlot
  from '../../../../../../../../../assets/js/components/resources/treasure/pages/elements/show/TreasureValueFieldSlot.jsx';
import TreasureValueField
  from '../../../../../../../../../assets/js/components/resources/treasure/pages/elements/TreasureValueField.jsx';

describe('TreasureValueFieldSlot', function() {
  const buildProps = (overrides = {}) => ({
    mode: 'new',
    value: '500',
    fieldErrors: {},
    gameType: 'dnd',
    handlers: { onOpenValueModal: jasmine.createSpy('onOpenValueModal') },
    ...overrides,
  });

  it('renders a TreasureValueField with the new-mode label', function() {
    const element = TreasureValueFieldSlot(buildProps());

    expect(element.type).toBe(TreasureValueField);
    expect(element.props.label).toBe('Value');
    expect(element.props.value).toBe('500');
  });

  it('shares the same "edit value" button label between new and edit', function() {
    const newElement = TreasureValueFieldSlot(buildProps({ mode: 'new' }));
    const editElement = TreasureValueFieldSlot(buildProps({ mode: 'edit' }));

    expect(newElement.props.editLabel).toBe('Edit');
    expect(editElement.props.editLabel).toBe('Edit');
  });

  it('passes field errors through', function() {
    const element = TreasureValueFieldSlot(buildProps({ fieldErrors: { value: ['is invalid'] } }));

    expect(element.props.errors).toEqual(['is invalid']);
  });

  it('passes the gameType through', function() {
    const element = TreasureValueFieldSlot(buildProps({ gameType: 'deadlands' }));

    expect(element.props.gameType).toBe('deadlands');
  });

  it('wires onOpenModal to handlers.onOpenValueModal', function() {
    const handlers = { onOpenValueModal: jasmine.createSpy('onOpenValueModal') };
    const element = TreasureValueFieldSlot(buildProps({ handlers }));

    expect(element.props.onOpenModal).toBe(handlers.onOpenValueModal);
  });
});
