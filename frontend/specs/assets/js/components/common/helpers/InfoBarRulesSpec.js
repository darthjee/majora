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
  });
});
