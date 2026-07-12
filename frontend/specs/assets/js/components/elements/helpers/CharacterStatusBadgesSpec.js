import CharacterStatusBadges from '../../../../../../assets/js/components/elements/helpers/CharacterStatusBadges.js';
import { buildCharacter } from '../../../../../support/factories.js';

describe('CharacterStatusBadges', function() {
  describe('.build', function() {
    it('returns no items for a character with no status fields set', function() {
      const character = buildCharacter({ is_pc: true });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('builds the Slain item when slain is true', function() {
      const character = buildCharacter({ is_pc: true, slain: true });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-skull-fill', text: 'Slain', variant: 'danger' },
      ]);
    });

    it('builds the Alive item when slain is false', function() {
      const character = buildCharacter({ is_pc: true, slain: false });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-heart-fill', text: 'Alive', variant: 'success' },
      ]);
    });

    it('omits the Slain/Alive item when slain is null', function() {
      const character = buildCharacter({ is_pc: true, slain: null });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('omits the Slain/Alive item when slain is missing', function() {
      const character = buildCharacter({ is_pc: true });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('builds the Known as Slain item when public_slain is true', function() {
      const character = buildCharacter({ is_pc: true, public_slain: true });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-skull', text: 'Known as Slain', variant: 'danger' },
      ]);
    });

    it('builds the Known as Alive item when public_slain is false', function() {
      const character = buildCharacter({ is_pc: true, public_slain: false });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-heart', text: 'Known as Alive', variant: 'success' },
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
      const character = buildCharacter({ is_pc: true, slain: true, public_slain: false });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-skull-fill', text: 'Slain', variant: 'danger' },
        { icon: 'bi-heart', text: 'Known as Alive', variant: 'success' },
      ]);
    });

    it('builds the Enemy allegiance item for an NPC', function() {
      const character = buildCharacter({ is_pc: false, allegiance: 'enemy' });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-emoji-angry-fill', text: 'Enemy', variant: 'danger' },
      ]);
    });

    it('builds the Ally allegiance item for an NPC', function() {
      const character = buildCharacter({ is_pc: false, allegiance: 'ally' });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-emoji-smile-fill', text: 'Ally', variant: 'success' },
      ]);
    });

    it('builds the Neutral allegiance item with no color for an NPC', function() {
      const character = buildCharacter({ is_pc: false, allegiance: 'neutral' });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-emoji-expressionless-fill', text: 'Neutral', variant: null },
      ]);
    });

    it('omits the allegiance item when allegiance is null', function() {
      const character = buildCharacter({ is_pc: false, allegiance: null });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('omits the allegiance item when allegiance is missing', function() {
      const character = buildCharacter({ is_pc: false });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('omits the allegiance item for a PC even when allegiance is set', function() {
      const character = buildCharacter({ is_pc: true, allegiance: 'enemy' });

      expect(CharacterStatusBadges.build(character)).toEqual([]);
    });

    it('builds the Known as Enemy public allegiance item for an NPC', function() {
      const character = buildCharacter({ is_pc: false, public_allegiance: 'enemy' });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-emoji-angry', text: 'Known as Enemy', variant: 'danger' },
      ]);
    });

    it('builds the Known as Ally public allegiance item for an NPC', function() {
      const character = buildCharacter({ is_pc: false, public_allegiance: 'ally' });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-emoji-smile', text: 'Known as Ally', variant: 'success' },
      ]);
    });

    it('builds the Known as Neutral public allegiance item with no color for an NPC', function() {
      const character = buildCharacter({ is_pc: false, public_allegiance: 'neutral' });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-emoji-expressionless', text: 'Known as Neutral', variant: null },
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
        slain: true,
        public_slain: false,
        allegiance: 'enemy',
        public_allegiance: 'ally',
      });

      expect(CharacterStatusBadges.build(character)).toEqual([
        { icon: 'bi-skull-fill', text: 'Slain', variant: 'danger' },
        { icon: 'bi-heart', text: 'Known as Alive', variant: 'success' },
        { icon: 'bi-emoji-angry-fill', text: 'Enemy', variant: 'danger' },
        { icon: 'bi-emoji-smile', text: 'Known as Ally', variant: 'success' },
      ]);
    });
  });
});
