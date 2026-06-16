import React from 'react';

/**
 * Rendering helper for game navigation links.
 */
export default class GameNavLinksHelper {
  /**
   * Render navigation buttons linking to a game's PCs and NPCs pages.
   *
   * @param {string} gameSlug - The game slug used to build the link hrefs.
   * @returns {React.ReactElement} Navigation links element.
   */
  static render(gameSlug) {
    return (
      <div className="mt-4 d-flex flex-wrap gap-2">
        <a href={`#/games/${gameSlug}/pcs`} className="btn btn-outline-primary">
          Player Characters
        </a>
        <a href={`#/games/${gameSlug}/npcs`} className="btn btn-outline-secondary">
          Non-Player Characters
        </a>
      </div>
    );
  }
}
