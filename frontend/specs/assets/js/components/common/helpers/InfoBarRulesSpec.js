import InfoBarRules from '../../../../../../assets/js/components/common/helpers/InfoBarRules.js';
import TooltipBadge from '../../../../../../assets/js/components/common/TooltipBadge.jsx';
import Icons from '../../../../../../assets/js/utils/ui/Icons.js';
import CharacterStatusBadges from '../../../../../../assets/js/components/common/helpers/CharacterStatusBadges.js';
import { buildCharacter } from '../../../../../support/factories.js';

describe('InfoBarRules', function() {
  describe('.build', function() {
    it('returns no items for a PC with no status fields set', function() {
      const character = buildCharacter({ is_pc: true });

      expect(InfoBarRules.build(character)).toEqual([]);
    });

    it('returns no items for an NPC with no status fields set', function() {
      const character = buildCharacter({ is_pc: false });

      expect(InfoBarRules.build(character)).toEqual([]);
    });

    it('returns no items for a character editor (can_edit) with no status fields set', function() {
      const character = buildCharacter({ can_edit: true });

      expect(InfoBarRules.build(character)).toEqual([]);
    });

    it('returns no items for a player (is_player) with no status fields set', function() {
      const character = buildCharacter({ is_player: true });

      expect(InfoBarRules.build(character)).toEqual([]);
    });

    it('returns no items for a plain visitor (neither can_edit nor is_player) with no status fields set', function() {
      const character = buildCharacter({ can_edit: false, is_player: false });

      expect(InfoBarRules.build(character)).toEqual([]);
    });

    it('returns a single status tooltip badge item when the character has slain status', function() {
      const character = buildCharacter({ slain: true, public_slain: true });

      const items = InfoBarRules.build(character);

      expect(items.length).toBe(1);
      expect(items[0].key).toBe('status');
      expect(items[0].label.type).toBe(TooltipBadge);
    });

    it('builds the status tooltip badge with the info-circle-fill icon', function() {
      const character = buildCharacter({ slain: true });

      const items = InfoBarRules.build(character);

      expect(items[0].label.props.icon).toBe(Icons.infoCircleFill);
    });

    it('builds the status tooltip badge with the CharacterStatusBadges item list', function() {
      const character = buildCharacter({ slain: true, public_slain: false });

      const items = InfoBarRules.build(character);

      expect(items[0].label.props.items).toEqual(CharacterStatusBadges.build(character));
    });

    it('returns a status item for an NPC whose allegiance is set', function() {
      const character = buildCharacter({ is_pc: false, allegiance: 'ally' });

      const items = InfoBarRules.build(character);

      expect(items.length).toBe(1);
    });

    it('returns no items for a PC whose allegiance is set (allegiance is NPC-only)', function() {
      const character = buildCharacter({ is_pc: true, allegiance: 'ally' });

      expect(InfoBarRules.build(character)).toEqual([]);
    });

    it('returns an allegiance-deception item for an NPC whose allegiance and public_allegiance differ', function() {
      const character = buildCharacter({ is_pc: false, allegiance: 'enemy', public_allegiance: 'ally' });

      const items = InfoBarRules.build(character);
      const item = items.find((entry) => entry.key === 'allegiance-deception');

      expect(item).toBeDefined();
      expect(item.label.type).toBe(TooltipBadge);
      expect(item.label.props.icon).toBe(Icons.emojiGrimace);
      expect(item.label.props.variant).toBe('warning');
    });

    it('omits the allegiance-deception item when allegiance and public_allegiance are equal', function() {
      const character = buildCharacter({ is_pc: false, allegiance: 'enemy', public_allegiance: 'enemy' });

      const items = InfoBarRules.build(character);

      expect(items.some((entry) => entry.key === 'allegiance-deception')).toBe(false);
    });

    it('omits the allegiance-deception item for a PC even when allegiance and public_allegiance differ', function() {
      const character = buildCharacter({ is_pc: true, allegiance: 'enemy', public_allegiance: 'ally' });

      const items = InfoBarRules.build(character);

      expect(items.some((entry) => entry.key === 'allegiance-deception')).toBe(false);
    });

    it('returns a slain-deception item for an NPC whose slain and public_slain differ', function() {
      const character = buildCharacter({ is_pc: false, slain: true, public_slain: false });

      const items = InfoBarRules.build(character);
      const item = items.find((entry) => entry.key === 'slain-deception');

      expect(item).toBeDefined();
      expect(item.label.type).toBe(TooltipBadge);
      expect(item.label.props.icon).toBe(Icons.emojiDizzy);
      expect(item.label.props.variant).toBe('warning');
    });

    it('omits the slain-deception item when slain and public_slain are equal', function() {
      const character = buildCharacter({ is_pc: false, slain: true, public_slain: true });

      const items = InfoBarRules.build(character);

      expect(items.some((entry) => entry.key === 'slain-deception')).toBe(false);
    });

    it('omits the slain-deception item for a PC even when slain and public_slain differ', function() {
      const character = buildCharacter({ is_pc: true, slain: true, public_slain: false });

      const items = InfoBarRules.build(character);

      expect(items.some((entry) => entry.key === 'slain-deception')).toBe(false);
    });

    it('returns both deception items alongside the status item when all conditions are met', function() {
      const character = buildCharacter({
        is_pc: false,
        slain: true,
        public_slain: false,
        allegiance: 'enemy',
        public_allegiance: 'ally',
      });

      const items = InfoBarRules.build(character);

      expect(items.map((entry) => entry.key)).toEqual(['status', 'allegiance-deception', 'slain-deception']);
    });
  });
});
