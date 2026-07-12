import InfoBarRules from '../../../../../../assets/js/components/elements/helpers/InfoBarRules.js';
import { buildCharacter } from '../../../../../support/factories.js';

describe('InfoBarRules', function() {
  describe('.build', function() {
    it('returns no items for a PC', function() {
      const character = buildCharacter({ is_pc: true });

      expect(InfoBarRules.build(character)).toEqual([]);
    });

    it('returns no items for an NPC', function() {
      const character = buildCharacter({ is_pc: false });

      expect(InfoBarRules.build(character)).toEqual([]);
    });

    it('returns no items for a character editor (can_edit)', function() {
      const character = buildCharacter({ can_edit: true });

      expect(InfoBarRules.build(character)).toEqual([]);
    });

    it('returns no items for a player (is_player)', function() {
      const character = buildCharacter({ is_player: true });

      expect(InfoBarRules.build(character)).toEqual([]);
    });

    it('returns no items for a plain visitor (neither can_edit nor is_player)', function() {
      const character = buildCharacter({ can_edit: false, is_player: false });

      expect(InfoBarRules.build(character)).toEqual([]);
    });

    it('returns no items for a slain character', function() {
      const character = buildCharacter({ slain: true, public_slain: true });

      expect(InfoBarRules.build(character)).toEqual([]);
    });
  });
});
