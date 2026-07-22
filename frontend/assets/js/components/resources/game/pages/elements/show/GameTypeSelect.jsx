import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * New-mode right-column slot: the game-type select, only offered on creation (there's no
 * game-type edit affordance today).
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.gameType - Currently selected game type.
 * @param {{onGameTypeChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Game-type select field.
 */
export default function GameTypeSelect({ gameType, handlers }) {
  return (
    <div className="mb-3">
      <label htmlFor="game-new-type" className="form-label">
        {Translator.t('game_new_page.game_type_label')}
      </label>
      <select
        id="game-new-type"
        className="form-select"
        value={gameType}
        onChange={handlers.onGameTypeChange}
      >
        <option value="dnd">D&amp;D</option>
        <option value="deadlands">Deadlands</option>
      </select>
    </div>
  );
}
