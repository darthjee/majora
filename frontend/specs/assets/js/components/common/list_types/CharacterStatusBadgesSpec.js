import CharacterStatusBadges from '../../../../../../assets/js/components/common/list_types/CharacterStatusBadges.js';
import Translator from '../../../../../../assets/js/i18n/Translator.js';
import { buildCharacter } from '../../../../../support/factories.js';

const t = (key) => Translator.t(`character_status_badges.${key}`);

describe('CharacterStatusBadges', function() {
  describe('.build', function() {
    it('returns no items for a character with no status fields set', function() {
      const character = buildCharacter({ is_pc: true });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('builds the Slain item when private_slain is true', function() {
      const character = buildCharacter({ is_pc: true, private_slain: true });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-skull-fill', text: t('private_slain'), variant: 'danger' },
      ]);
    });

    it('builds the Alive item when private_slain is false', function() {
      const character = buildCharacter({ is_pc: true, private_slain: false });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-heart-fill', text: t('private_alive'), variant: 'success' },
      ]);
    });

    it('omits the Slain/Alive item when private_slain is null', function() {
      const character = buildCharacter({ is_pc: true, private_slain: null });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('omits the Slain/Alive item when private_slain is missing', function() {
      const character = buildCharacter({ is_pc: true });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('builds the Known as Slain item when public_slain is true', function() {
      const character = buildCharacter({ is_pc: true, public_slain: true });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-skull', text: t('public_slain'), variant: 'danger' },
      ]);
    });

    it('builds the Known as Alive item when public_slain is false', function() {
      const character = buildCharacter({ is_pc: true, public_slain: false });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-heart', text: t('public_alive'), variant: 'success' },
      ]);
    });

    it('omits the Public Slain/Alive item when public_slain is null', function() {
      const character = buildCharacter({ is_pc: true, public_slain: null });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('omits the Public Slain/Alive item when public_slain is missing', function() {
      const character = buildCharacter({ is_pc: true });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('builds both Slain and Public Slain items in order', function() {
      const character = buildCharacter({ is_pc: true, private_slain: true, public_slain: false });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-skull-fill', text: t('private_slain'), variant: 'danger' },
        { icon: 'bi-heart', text: t('public_alive'), variant: 'success' },
      ]);
    });

    it('builds the Enemy allegiance item for an NPC', function() {
      const character = buildCharacter({ is_pc: false, private_allegiance: 'enemy' });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-emoji-angry-fill', text: t('private_enemy'), variant: 'danger' },
      ]);
    });

    it('builds the Ally allegiance item for an NPC', function() {
      const character = buildCharacter({ is_pc: false, private_allegiance: 'ally' });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-emoji-smile-fill', text: t('private_ally'), variant: 'success' },
      ]);
    });

    it('builds the Neutral allegiance item with no color for an NPC', function() {
      const character = buildCharacter({ is_pc: false, private_allegiance: 'neutral' });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-emoji-expressionless-fill', text: t('private_neutral'), variant: null },
      ]);
    });

    it('omits the allegiance item when private_allegiance is null', function() {
      const character = buildCharacter({ is_pc: false, private_allegiance: null });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('omits the allegiance item when private_allegiance is missing', function() {
      const character = buildCharacter({ is_pc: false });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('omits the allegiance item for a PC even when private_allegiance is set', function() {
      const character = buildCharacter({ is_pc: true, private_allegiance: 'enemy' });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('builds the Known as Enemy public allegiance item for an NPC', function() {
      const character = buildCharacter({ is_pc: false, public_allegiance: 'enemy' });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-emoji-angry', text: t('public_enemy'), variant: 'danger' },
      ]);
    });

    it('builds the Known as Ally public allegiance item for an NPC', function() {
      const character = buildCharacter({ is_pc: false, public_allegiance: 'ally' });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-emoji-smile', text: t('public_ally'), variant: 'success' },
      ]);
    });

    it('builds the Known as Neutral public allegiance item with no color for an NPC', function() {
      const character = buildCharacter({ is_pc: false, public_allegiance: 'neutral' });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-emoji-expressionless', text: t('public_neutral'), variant: null },
      ]);
    });

    it('omits the public allegiance item when public_allegiance is null', function() {
      const character = buildCharacter({ is_pc: false, public_allegiance: null });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('omits the public allegiance item when public_allegiance is missing', function() {
      const character = buildCharacter({ is_pc: false });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('omits the public allegiance item for a PC even when public_allegiance is set', function() {
      const character = buildCharacter({ is_pc: true, public_allegiance: 'ally' });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('builds all four items in order for an NPC with every field set', function() {
      const character = buildCharacter({
        is_pc: false,
        private_slain: true,
        public_slain: false,
        private_allegiance: 'enemy',
        public_allegiance: 'ally',
      });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-skull-fill', text: t('private_slain'), variant: 'danger' },
        { icon: 'bi-heart', text: t('public_alive'), variant: 'success' },
        { icon: 'bi-emoji-angry-fill', text: t('private_enemy'), variant: 'danger' },
        { icon: 'bi-emoji-smile', text: t('public_ally'), variant: 'success' },
      ]);
    });

    it('builds the Hidden item for an NPC when hidden is true', function() {
      const character = buildCharacter({ is_pc: false, hidden: true });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-eye-slash-fill', text: t('hidden'), variant: null },
      ]);
    });

    it('omits the Hidden item when hidden is false', function() {
      const character = buildCharacter({ is_pc: false, hidden: false });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('omits the Hidden item when hidden is missing', function() {
      const character = buildCharacter({ is_pc: false });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('omits the Hidden item for a PC even when hidden is set', function() {
      const character = buildCharacter({ is_pc: true, hidden: true });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('builds the Incognito item for an NPC when incognito is true', function() {
      const character = buildCharacter({ is_pc: false, incognito: true });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-incognito', text: t('incognito'), variant: null },
      ]);
    });

    it('omits the Incognito item when incognito is false', function() {
      const character = buildCharacter({ is_pc: false, incognito: false });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('omits the Incognito item when incognito is missing', function() {
      const character = buildCharacter({ is_pc: false });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('omits the Incognito item for a PC even when incognito is set', function() {
      const character = buildCharacter({ is_pc: true, incognito: true });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('lists the Incognito item after the Hidden item when both are present', function() {
      const character = buildCharacter({ is_pc: false, hidden: true, incognito: true });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-eye-slash-fill', text: t('hidden'), variant: null },
        { icon: 'bi-incognito', text: t('incognito'), variant: null },
      ]);
    });
  });

  describe('.buildHidden', function() {
    it('returns the Hidden item when hidden is true', function() {
      const character = buildCharacter({ is_pc: false, hidden: true });

      expect(CharacterStatusBadges.buildHidden(character)).toEqual(
        { icon: 'bi-eye-slash-fill', text: t('hidden'), variant: null },
      );
    });

    it('returns null when hidden is false', function() {
      const character = buildCharacter({ is_pc: false, hidden: false });

      expect(CharacterStatusBadges.buildHidden(character)).toBeNull();
    });

    it('returns null when hidden is missing', function() {
      const character = buildCharacter({ is_pc: false });

      expect(CharacterStatusBadges.buildHidden(character)).toBeNull();
    });
  });

  describe('.buildIncognito', function() {
    it('returns the Incognito item when incognito is true', function() {
      const character = buildCharacter({ is_pc: false, incognito: true });

      expect(CharacterStatusBadges.buildIncognito(character)).toEqual(
        { icon: 'bi-incognito', text: t('incognito'), variant: null },
      );
    });

    it('returns null when incognito is false', function() {
      const character = buildCharacter({ is_pc: false, incognito: false });

      expect(CharacterStatusBadges.buildIncognito(character)).toBeNull();
    });

    it('returns null when incognito is missing', function() {
      const character = buildCharacter({ is_pc: false });

      expect(CharacterStatusBadges.buildIncognito(character)).toBeNull();
    });
  });
});
