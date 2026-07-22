import GameOpenPollsWidgetSlot
  from '../../../../../../../../../assets/js/components/resources/game/pages/elements/show/GameOpenPollsWidgetSlot.jsx';
import OpenPollsWidget from '../../../../../../../../../assets/js/components/resources/game/pages/elements/OpenPollsWidget.jsx';

describe('GameOpenPollsWidgetSlot', function() {
  it('renders OpenPollsWidget, passing the whole context through as its game prop', function() {
    const context = { game_slug: 'epic-quest', is_dm: true };
    const element = GameOpenPollsWidgetSlot(context);

    expect(element.type).toBe(OpenPollsWidget);
    expect(element.props.game).toBe(context);
  });
});
