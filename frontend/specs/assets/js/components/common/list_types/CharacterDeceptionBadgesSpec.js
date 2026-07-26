import CharacterDeceptionBadges from '../../../../../../assets/js/components/common/list_types/CharacterDeceptionBadges.js';
import CharacterStatusBadges from '../../../../../../assets/js/components/common/list_types/CharacterStatusBadges.js';
import { buildCharacter } from '../../../../../support/factories.js';

describe('CharacterDeceptionBadges', function() {
  describe('.buildAllegianceDeception', function() {
    it('returns null when private_allegiance and public_allegiance are equal', function() {
      const character = buildCharacter({ private_allegiance: 'enemy', public_allegiance: 'enemy' });

      expect(CharacterDeceptionBadges.buildAllegianceDeception(character)).toBeNull();
    });

    it('returns null when private_allegiance is missing', function() {
      const character = buildCharacter({ public_allegiance: 'enemy' });

      expect(CharacterDeceptionBadges.buildAllegianceDeception(character)).toBeNull();
    });

    it('returns null when public_allegiance is missing', function() {
      const character = buildCharacter({ private_allegiance: 'enemy' });

      expect(CharacterDeceptionBadges.buildAllegianceDeception(character)).toBeNull();
    });

    it('returns null when private_allegiance is null', function() {
      const character = buildCharacter({ private_allegiance: null, public_allegiance: 'enemy' });

      expect(CharacterDeceptionBadges.buildAllegianceDeception(character)).toBeNull();
    });

    it('returns null when public_allegiance is null', function() {
      const character = buildCharacter({ private_allegiance: 'enemy', public_allegiance: null });

      expect(CharacterDeceptionBadges.buildAllegianceDeception(character)).toBeNull();
    });

    it('builds the badge when private_allegiance and public_allegiance are both present and differ', function() {
      const character = buildCharacter({ private_allegiance: 'enemy', public_allegiance: 'ally' });

      const badge = CharacterDeceptionBadges.buildAllegianceDeception(character);

      expect(badge.icon).toBe('bi-emoji-grimace');
      expect(badge.items).toEqual([
        { icon: 'bi-emoji-grimace', text: 'Players deceived', variant: 'warning' },
        CharacterStatusBadges.buildAllegiance(character),
        CharacterStatusBadges.buildPublicAllegiance(character),
      ]);
    });

    it('returns null when private_allegiance is neutral and public_allegiance differs', function() {
      const character = buildCharacter({ private_allegiance: 'neutral', public_allegiance: 'ally' });

      expect(CharacterDeceptionBadges.buildAllegianceDeception(character)).toBeNull();
    });

    it('returns null when public_allegiance is neutral and private_allegiance differs', function() {
      const character = buildCharacter({ private_allegiance: 'enemy', public_allegiance: 'neutral' });

      expect(CharacterDeceptionBadges.buildAllegianceDeception(character)).toBeNull();
    });
  });

  describe('.buildSlainDeception', function() {
    it('returns null when private_slain and public_slain are equal', function() {
      const character = buildCharacter({ private_slain: true, public_slain: true });

      expect(CharacterDeceptionBadges.buildSlainDeception(character)).toBeNull();
    });

    it('returns null when private_slain is missing', function() {
      const character = buildCharacter({ public_slain: true });

      expect(CharacterDeceptionBadges.buildSlainDeception(character)).toBeNull();
    });

    it('returns null when public_slain is missing', function() {
      const character = buildCharacter({ private_slain: true });

      expect(CharacterDeceptionBadges.buildSlainDeception(character)).toBeNull();
    });

    it('returns null when private_slain is null', function() {
      const character = buildCharacter({ private_slain: null, public_slain: true });

      expect(CharacterDeceptionBadges.buildSlainDeception(character)).toBeNull();
    });

    it('returns null when public_slain is null', function() {
      const character = buildCharacter({ private_slain: true, public_slain: null });

      expect(CharacterDeceptionBadges.buildSlainDeception(character)).toBeNull();
    });

    it('builds the badge when private_slain and public_slain are both present and differ', function() {
      const character = buildCharacter({ private_slain: true, public_slain: false });

      const badge = CharacterDeceptionBadges.buildSlainDeception(character);

      expect(badge.icon).toBe('bi-emoji-dizzy');
      expect(badge.items).toEqual([
        { icon: 'bi-emoji-dizzy', text: 'Players deceived', variant: 'warning' },
        CharacterStatusBadges.buildSlain(character),
        CharacterStatusBadges.buildPublicSlain(character),
      ]);
    });

    it('builds the badge when private_slain is false and public_slain is true', function() {
      const character = buildCharacter({ private_slain: false, public_slain: true });

      const badge = CharacterDeceptionBadges.buildSlainDeception(character);

      expect(badge).not.toBeNull();
      expect(badge.items.length).toBe(3);
    });
  });
});
