import Translator from '../../../i18n/Translator.js';
import Icons from '../../../utils/Icons.js';

const ALLEGIANCE_VARIANTS = { enemy: 'danger', ally: 'success', neutral: null };

/**
 * Rules class deciding which character status items (icon + text + color)
 * should appear in a character photo's info-bar tooltip (see
 * `CharacterStatusBadges.build`), given the full character object.
 * Parallel to `SlainSecondaryButtons`: keeps the item shape (`{icon, text,
 * variant}`) in one place, omitting any item whose underlying field is
 * null/missing.
 */
export default class CharacterStatusBadges {
  /**
   * Build the ordered list of character status items: real Slain/Alive,
   * public Slain/Alive (both PC and NPC), and, for NPCs only, real and
   * public Allegiance. Any item whose underlying field is null/missing is
   * omitted.
   *
   * @param {object} character - Character data object.
   * @param {boolean} [character.is_pc] - Whether the character is a PC (vs. an NPC);
   *   allegiance items are only built for NPCs.
   * @param {boolean} [character.slain] - The character's real slain state.
   * @param {boolean} [character.public_slain] - The character's public slain state.
   * @param {string} [character.allegiance] - The character's real allegiance
   *   (`'enemy'`, `'ally'`, or `'neutral'`), NPC only.
   * @param {string} [character.public_allegiance] - The character's public allegiance
   *   (`'enemy'`, `'ally'`, or `'neutral'`), NPC only.
   * @returns {{icon: string, text: string, variant: string|null}[]} Ordered status item definitions.
   */
  static build(character) {
    const items = [
      CharacterStatusBadges.#buildSlain(character),
      CharacterStatusBadges.#buildPublicSlain(character),
    ];

    if (!character.is_pc) {
      items.push(
        CharacterStatusBadges.#buildAllegiance(character),
        CharacterStatusBadges.#buildPublicAllegiance(character),
      );
    }

    return items.filter((item) => item !== null);
  }

  static #buildSlain(character) {
    if (character.slain === null || character.slain === undefined) {
      return null;
    }

    return character.slain
      ? { icon: Icons.skullFill, text: Translator.t('character_status_badges.slain'), variant: 'danger' }
      : { icon: Icons.heart, text: Translator.t('character_status_badges.alive'), variant: 'success' };
  }

  static #buildPublicSlain(character) {
    if (character.public_slain === null || character.public_slain === undefined) {
      return null;
    }

    return character.public_slain
      ? {
        icon: Icons.skull,
        text: Translator.t('character_status_badges.public_slain'),
        variant: 'danger',
      }
      : {
        icon: Icons.heartOutline,
        text: Translator.t('character_status_badges.public_alive'),
        variant: 'success',
      };
  }

  static #buildAllegiance(character) {
    return CharacterStatusBadges.#buildAllegianceItem(
      character.allegiance,
      { enemy: Icons.emojiAngryFill, ally: Icons.emojiSmileFill, neutral: Icons.emojiExpressionlessFill },
      { enemy: 'enemy', ally: 'ally', neutral: 'neutral' },
    );
  }

  static #buildPublicAllegiance(character) {
    return CharacterStatusBadges.#buildAllegianceItem(
      character.public_allegiance,
      { enemy: Icons.emojiAngry, ally: Icons.emojiSmile, neutral: Icons.emojiExpressionless },
      { enemy: 'public_enemy', ally: 'public_ally', neutral: 'public_neutral' },
    );
  }

  static #buildAllegianceItem(allegiance, icons, translationKeys) {
    const icon = icons[allegiance];

    if (!icon) {
      return null;
    }

    return {
      icon,
      text: Translator.t(`character_status_badges.${translationKeys[allegiance]}`),
      variant: ALLEGIANCE_VARIANTS[allegiance],
    };
  }
}
