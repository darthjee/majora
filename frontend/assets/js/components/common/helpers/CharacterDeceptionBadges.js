import Translator from '../../../i18n/Translator.js';
import Icons from '../../../utils/ui/Icons.js';
import CharacterStatusBadges from './CharacterStatusBadges.js';

/**
 * Rules class deciding whether a character's real state has been
 * deliberately misrepresented to players (real vs. `public_*` field
 * mismatch), and, when so, building the `{icon, items}` badge definition for
 * the corresponding "deception" tooltip badge (see `InfoBarRules`). Unlike
 * `CharacterStatusBadges` — which builds individual *tooltip line items* —
 * this class builds full standalone badges, each with its own icon and a
 * short, purpose-built tooltip item list. A badge is only built when both
 * the real and public fields are present (not null/missing) and differ,
 * since the fields' mere presence doubles as the viewer-permission check
 * (see the plan/issue for #480).
 */
export default class CharacterDeceptionBadges {
  /**
   * Build the allegiance-deception badge definition, or `null` when
   * `character.allegiance`/`character.public_allegiance` are missing, equal,
   * or either one is `'neutral'` — a neutral allegiance isn't a claimed side
   * that turns out false, so it never counts as deception.
   *
   * @param {object} character - Character data object.
   * @param {string} [character.allegiance] - The character's real allegiance.
   * @param {string} [character.public_allegiance] - The character's public allegiance.
   * @returns {{icon: string, items: object[]}|null} The badge definition, or null.
   */
  static buildAllegianceDeception(character) {
    if (!CharacterDeceptionBadges.#differs(character.allegiance, character.public_allegiance)) {
      return null;
    }

    if (character.allegiance === 'neutral' || character.public_allegiance === 'neutral') {
      return null;
    }

    return {
      icon: Icons.emojiGrimace,
      items: [
        CharacterDeceptionBadges.#buildHeading(Icons.emojiGrimace),
        CharacterStatusBadges.buildAllegiance(character),
        CharacterStatusBadges.buildPublicAllegiance(character),
      ],
    };
  }

  /**
   * Build the slain-deception badge definition, or `null` when
   * `character.slain`/`character.public_slain` are missing or equal.
   *
   * @param {object} character - Character data object.
   * @param {boolean} [character.slain] - The character's real slain state.
   * @param {boolean} [character.public_slain] - The character's public slain state.
   * @returns {{icon: string, items: object[]}|null} The badge definition, or null.
   */
  static buildSlainDeception(character) {
    if (!CharacterDeceptionBadges.#differs(character.slain, character.public_slain)) {
      return null;
    }

    return {
      icon: Icons.emojiDizzy,
      items: [
        CharacterDeceptionBadges.#buildHeading(Icons.emojiDizzy),
        CharacterStatusBadges.buildSlain(character),
        CharacterStatusBadges.buildPublicSlain(character),
      ],
    };
  }

  static #differs(realValue, publicValue) {
    if (realValue === null || realValue === undefined) {
      return false;
    }

    if (publicValue === null || publicValue === undefined) {
      return false;
    }

    return realValue !== publicValue;
  }

  static #buildHeading(icon) {
    return {
      icon,
      text: Translator.t('character_status_badges.players_deceived'),
      variant: 'warning',
    };
  }
}
