import ItemCardHelper from '../../../../../../assets/js/components/common/list_types/ItemCardHelper.jsx';
import TooltipBadge from '../../../../../../assets/js/components/common/badges/TooltipBadge.jsx';

describe('ItemCardHelper', function() {
  describe('.buildInfoBarItems', function() {
    it('returns an empty array when hidden is omitted', function() {
      const item = { id: 1, name: 'Cloak of Elvenkind' };

      expect(ItemCardHelper.buildInfoBarItems(item, 'Hidden')).toEqual([]);
    });

    it('returns an empty array when hidden is false', function() {
      const item = { id: 1, name: 'Cloak of Elvenkind', hidden: false };

      expect(ItemCardHelper.buildInfoBarItems(item, 'Hidden')).toEqual([]);
    });

    it('renders the hidden badge as a TooltipBadge with the given label as tooltip content', function() {
      const item = { id: 1, name: 'Cloak of Elvenkind', hidden: true };

      const items = ItemCardHelper.buildInfoBarItems(item, 'Hidden');

      expect(items.length).toBe(1);
      expect(items[0].key).toBe('hidden');
      expect(items[0].label.type).toBe(TooltipBadge);
      expect(items[0].label.props.items).toEqual([{
        icon: 'bi-eye-slash-fill',
        text: 'Hidden',
        variant: null,
      }]);
    });
  });
});
