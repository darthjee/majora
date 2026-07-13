import Translator from '../../../i18n/Translator.js';
import Icons from '../../../utils/Icons.js';

/**
 * Shared builder for the character picture's real/public slain-revive
 * secondary button definitions (`{label, variant, icon, onClick}`), used by
 * both the character show page (`CharacterHelper`) and the character index
 * card (`CharacterCardHelper`) so the button shape isn't duplicated between
 * them. Gating (who sees which button) and `onClick`-wrapping stay with
 * each caller.
 */
export default class SlainSecondaryButtons {
  /**
   * Build the real slain/revive secondary button definition, using the
   * `Icons.heart`/`Icons.skullFill` icons and the `slain_button`/
   * `revive_button` translator keys. Used both for the DM's real-slain
   * button and for the single player-facing slain button, which share the
   * exact same shape.
   *
   * @param {boolean} slain - Whether the character is currently (really) slain.
   * @param {Function} onClick - Click handler for the button.
   * @returns {{label: string, variant: string, icon: string, onClick: Function}} Button definition.
   */
  static buildSlainButton(slain, onClick) {
    return {
      label: slain
        ? Translator.t('character_page.revive_button')
        : Translator.t('character_page.slain_button'),
      variant: slain ? 'success' : 'danger',
      icon: slain ? Icons.heart : Icons.skullFill,
      onClick,
    };
  }

  /**
   * Build the public slain/revive secondary button definition, using the
   * `Icons.heartOutline`/`Icons.skull` icons and the `public_slain_button`/
   * `public_revive_button` translator keys.
   *
   * @param {boolean} publicSlain - Whether the character is currently publicly slain.
   * @param {Function} onClick - Click handler for the button.
   * @returns {{label: string, variant: string, icon: string, onClick: Function}} Button definition.
   */
  static buildPublicSlainButton(publicSlain, onClick) {
    return {
      label: publicSlain
        ? Translator.t('character_page.public_revive_button')
        : Translator.t('character_page.public_slain_button'),
      variant: publicSlain ? 'success' : 'danger',
      icon: publicSlain ? Icons.heartOutline : Icons.skull,
      onClick,
    };
  }

  /**
   * Build the DM's real and public slain/revive secondary button pair, in
   * the order they are rendered (real slain/revive first, public
   * slain/revive second).
   *
   * @param {object} character - Character data object.
   * @param {boolean} [character.slain] - The character's real slain state.
   * @param {boolean} [character.public_slain] - The character's public slain state.
   * @param {Function} onSlainClick - Click handler for the real slain/revive button.
   * @param {Function} onPublicSlainClick - Click handler for the public slain/revive button.
   * @returns {{label: string, variant: string, icon: string, onClick: Function}[]} Secondary
   *   button definitions.
   */
  static buildDmButtons(character, onSlainClick, onPublicSlainClick) {
    return [
      SlainSecondaryButtons.buildSlainButton(character.slain, onSlainClick),
      SlainSecondaryButtons.buildPublicSlainButton(character.public_slain, onPublicSlainClick),
    ];
  }
}
