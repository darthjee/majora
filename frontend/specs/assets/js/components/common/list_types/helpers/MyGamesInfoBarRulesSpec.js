import MyGamesInfoBarRules from '../../../../../../../assets/js/components/common/list_types/helpers/MyGamesInfoBarRules.js';
import ConversationCountBadge from '../../../../../../../assets/js/components/common/badges/ConversationCountBadge.jsx';
import Badge from '../../../../../../../assets/js/components/common/badges/Badge.jsx';
import Icons from '../../../../../../../assets/js/utils/ui/Icons.js';

describe('MyGamesInfoBarRules', function() {
  describe('.build', function() {
    it('builds a DM role badge with the DM label', function() {
      const entry = { role: 'dm', character: null, conversations: { count: 0, unread_count: 0 } };

      const items = MyGamesInfoBarRules.build(entry);
      const roleItem = items.find((item) => item.key === 'role');

      expect(roleItem.label.type).toBe(Badge);
      expect(roleItem.label.props.text).toBe('DM');
    });

    it('builds a player role badge with the Player label', function() {
      const entry = { role: 'player', character: null, conversations: { count: 0, unread_count: 0 } };

      const items = MyGamesInfoBarRules.build(entry);
      const roleItem = items.find((item) => item.key === 'role');

      expect(roleItem.label.props.text).toBe('Player');
    });

    it('omits the character badge when the entry has no character', function() {
      const entry = { role: 'dm', character: null, conversations: { count: 0, unread_count: 0 } };

      const items = MyGamesInfoBarRules.build(entry);

      expect(items.some((item) => item.key === 'character')).toBe(false);
    });

    it('builds a character badge with the character name when present', function() {
      const entry = {
        role: 'player', character: { name: 'Aragorn' }, conversations: { count: 0, unread_count: 0 },
      };

      const items = MyGamesInfoBarRules.build(entry);
      const characterItem = items.find((item) => item.key === 'character');

      expect(characterItem.label.type).toBe(Badge);
      expect(characterItem.label.props.text).toBe('Aragorn');
    });

    it('builds the following-count badge with the envelope icon and count', function() {
      const entry = { role: 'dm', character: null, conversations: { count: 3, unread_count: 1 } };

      const items = MyGamesInfoBarRules.build(entry);
      const followingItem = items.find((item) => item.key === 'following-count');

      expect(followingItem.label.type).toBe(ConversationCountBadge);
      expect(followingItem.label.props.icon).toBe(Icons.envelope);
      expect(followingItem.label.props.text).toBe(3);
      expect(followingItem.label.props.tooltip).toBe('Following 3 conversations');
    });

    it('builds the unread-count badge with the filled envelope icon and count', function() {
      const entry = { role: 'dm', character: null, conversations: { count: 3, unread_count: 1 } };

      const items = MyGamesInfoBarRules.build(entry);
      const unreadItem = items.find((item) => item.key === 'unread-count');

      expect(unreadItem.label.type).toBe(ConversationCountBadge);
      expect(unreadItem.label.props.icon).toBe(Icons.envelopeFill);
      expect(unreadItem.label.props.text).toBe(1);
      expect(unreadItem.label.props.tooltip).toBe('1 unread conversations');
    });

    it('returns 4 items for a player with a character', function() {
      const entry = {
        role: 'player', character: { name: 'Aragorn' }, conversations: { count: 2, unread_count: 0 },
      };

      expect(MyGamesInfoBarRules.build(entry).length).toBe(4);
    });

    it('returns 3 items for a DM (no character badge)', function() {
      const entry = { role: 'dm', character: null, conversations: { count: 2, unread_count: 0 } };

      expect(MyGamesInfoBarRules.build(entry).length).toBe(3);
    });
  });
});
