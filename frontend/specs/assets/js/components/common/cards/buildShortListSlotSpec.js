import buildShortListSlot
  from '../../../../../../assets/js/components/common/cards/buildShortListSlot.js';
import ShortList from '../../../../../../assets/js/components/common/cards/ShortList.jsx';

describe('buildShortListSlot', function() {
  it('returns a component rendering a ShortList for the given resource', function() {
    const Slot = buildShortListSlot('treasure');
    const element = Slot({
      game_slug: 'demo', id: 7, is_pc: true, mode: 'show',
    });

    expect(element.type).toBe(ShortList);
    expect(element.props).toEqual({
      resource: 'treasure', maxItems: undefined, game_slug: 'demo', id: 7, is_pc: true, mode: 'show',
    });
  });

  it('forwards a given maxItems override', function() {
    const Slot = buildShortListSlot('pc', { maxItems: 3 });
    const element = Slot({ game_slug: 'demo' });

    expect(element.props.maxItems).toBe(3);
  });

  it('builds a distinct component per call', function() {
    expect(buildShortListSlot('pc')).not.toBe(buildShortListSlot('pc'));
  });
});
