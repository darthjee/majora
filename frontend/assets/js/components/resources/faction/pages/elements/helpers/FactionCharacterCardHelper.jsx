import React from 'react';
import CardAvatar from '../../../../../common/cards/CardAvatar.jsx';
import CardHoverTooltip from '../../../../../common/cards/CardHoverTooltip.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import Icons from '../../../../../../utils/ui/Icons.js';
import Noop from '../../../../../../utils/Noop.js';

/**
 * Rendering helper for the FactionCharacterCard element (issue #943), mirroring
 * `PossessionPreviewCardHelper`'s shape exactly, minus the `href` prop — the click-through target
 * is always derivable from the item itself (`character.type`/`character.id`), so it's built here
 * rather than threaded in by the caller.
 *
 * @description The card's navigation link uses Bootstrap's `stretched-link` utility (rather than
 *   wrapping the whole card in an anchor, issue #1106) so the hover-revealed kick action button can
 *   live alongside it without nesting interactive elements inside an interactive `<a>`, mirroring
 *   `TreasureCardHelper`'s own card-root/`stretched-link` split.
 */
export default class FactionCharacterCardHelper {
  /**
   * Render a grid-cell card showing a character's photo, matching `PossessionPreviewCard`'s
   * layout, with the character's name shown on hover. The whole card links to the character's own
   * detail page, branching on `character.type` (`'pc'` → the game's PC page, `'npc'` → the game's
   * NPC page), the same convention `shortListResourceConfig.js`'s `pc`/`npc` entries already use.
   * A hover-revealed kick action button (issue #1106) is rendered alongside the link when `canKick`
   * is true.
   *
   * @param {object} character - Faction character-list entry.
   * @param {number} character.id - Character id.
   * @param {string} character.name - Character name.
   * @param {string} character.type - Character type (`'pc'` or `'npc'`).
   * @param {string|null} [character.photo_path] - Optional character photo path.
   * @param {string} gameSlug - Game slug, used to build the click-through href.
   * @param {boolean} [canKick] - Whether the current viewer may kick this character from the
   *   faction; gates the kick button. Defaults to `false`.
   * @param {Function} [onKick] - Handler invoked with `character` when the kick button is clicked.
   *   Defaults to a no-op.
   * @returns {React.ReactElement} Faction character card element.
   */
  static render(character, gameSlug, canKick = false, onKick = Noop.noop) {
    const href = FactionCharacterCardHelper.#buildHref(character, gameSlug);

    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
        <div className="card h-100 position-relative">
          <div className="actions-overlay">
            <CardHoverTooltip content={character.name}>
              <a href={href} className="stretched-link text-decoration-none text-dark">
                <CardAvatar url={character.photo_path} alt={character.name} />
              </a>
            </CardHoverTooltip>
            {FactionCharacterCardHelper.#renderKickButton(character, canKick, onKick)}
          </div>
        </div>
      </div>
    );
  }

  static #renderKickButton(character, canKick, onKick) {
    if (!canKick) {
      return null;
    }

    const label = Translator.t('faction_page.kick_button');

    return (
      <button
        type="button"
        className="btn btn-sm btn-outline-danger actions-overlay-button-right"
        onClick={() => onKick(character)}
        aria-label={label}
        title={label}
      >
        <i className={`bi ${Icons.personX}`} aria-hidden="true"></i>
      </button>
    );
  }

  static #buildHref(character, gameSlug) {
    const segment = character.type === 'npc' ? 'npcs' : 'pcs';

    return `#/games/${gameSlug}/${segment}/${character.id}`;
  }
}
