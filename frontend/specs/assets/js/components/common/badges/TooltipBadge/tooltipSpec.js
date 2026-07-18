import TooltipBadge from '../../../../../../../assets/js/components/common/badges/TooltipBadge.jsx';
import InfoBadgeList from '../../../../../../../assets/js/components/common/badges/InfoBadgeList.jsx';

describe('TooltipBadge', function() {
  it('feeds the given items to InfoBadgeList inside the tooltip overlay', function() {
    const items = [
      { icon: 'bi-skull-fill', text: 'Slain', variant: 'danger' },
      { icon: 'bi-emoji-smile-fill', text: 'Ally', variant: 'success' },
    ];
    const rendered = TooltipBadge({ icon: 'bi-info-circle-fill', items });
    const list = rendered.props.overlay.props.children;

    expect(list.type).toBe(InfoBadgeList);
    expect(list.props.items).toBe(items);
  });

  it('defaults items to an empty array', function() {
    const rendered = TooltipBadge({ icon: 'bi-info-circle-fill' });
    const list = rendered.props.overlay.props.children;

    expect(list.props.items).toEqual([]);
  });
});
