import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Edit-mode right-column slot: the NPC's public-slain checkbox (NPC-only; no `new`-mode
 * equivalent, since a character cannot already be slain at creation), matching
 * `BaseCharacterEditHelper#renderSlainField`.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {boolean} context.publicSlain - Current public-slain checkbox value.
 * @param {{onPublicSlainChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Public-slain checkbox element.
 */
export default function CharacterPublicSlainFieldSlot({ publicSlain, handlers }) {
  return (
    <div className="form-check mb-3">
      <input
        id="npc-edit-public-slain"
        type="checkbox"
        className="form-check-input"
        checked={publicSlain}
        onChange={handlers.onPublicSlainChange}
      />
      <label htmlFor="npc-edit-public-slain" className="form-check-label">
        {Translator.t('character_status_badges.public_slain')}
      </label>
    </div>
  );
}
