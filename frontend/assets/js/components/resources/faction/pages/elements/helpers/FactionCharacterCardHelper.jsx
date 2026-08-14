import React from 'react';
import CardAvatar from '../../../../../common/cards/CardAvatar.jsx';
import CardHoverTooltip from '../../../../../common/cards/CardHoverTooltip.jsx';

/**
 * Rendering helper for the FactionCharacterCard element (issue #943), mirroring
 * `PossessionPreviewCardHelper`'s shape exactly, minus the `href` prop — the click-through target
 * is always derivable from the item itself (`character.type`/`character.id`), so it's built here
 * rather than threaded in by the caller.
 */
export default class FactionCharacterCardHelper {
  /**
   * Render a read-only grid-cell card showing a character's photo, matching
   * `PossessionPreviewCard`'s layout, with the character's name shown on hover. The whole card
   * links to the character's own detail page, branching on `character.type` (`'pc'` → the game's
   * PC page, `'npc'` → the game's NPC page), the same convention `shortListResourceConfig.js`'s
   * `pc`/`npc` entries already use.
   *
   * @param {object} character - Faction character-list entry.
   * @param {number} character.id - Character id.
   * @param {string} character.name - Character name.
   * @param {string} character.type - Character type (`'pc'` or `'npc'`).
   * @param {string|null} [character.photo_path] - Optional character photo path.
   * @param {string} gameSlug - Game slug, used to build the click-through href.
   * @returns {React.ReactElement} Faction character card element.
   */
  static render(character, gameSlug) {
    const href = FactionCharacterCardHelper.#buildHref(character, gameSlug);

    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
        <CardHoverTooltip content={character.name}>
          <a href={href} className="text-decoration-none text-dark">
            <div className="card h-100">
              <CardAvatar url={character.photo_path} alt={character.name} />
            </div>
          </a>
        </CardHoverTooltip>
      </div>
    );
  }

  static #buildHref(character, gameSlug) {
    const segment = character.type === 'npc' ? 'npcs' : 'pcs';

    return `#/games/${gameSlug}/${segment}/${character.id}`;
  }
}
