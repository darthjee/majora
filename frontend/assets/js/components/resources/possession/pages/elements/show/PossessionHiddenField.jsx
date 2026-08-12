import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';

const ID_KEYS = { new: 'possession-new-hidden', edit: 'possession-edit-hidden' };
const LABEL_KEYS = { new: 'possession_new_page.hidden_label', edit: 'possession_edit_page.hidden_label' };

/**
 * New/edit-mode slot: the `hidden` switch, mirroring `ItemHiddenField`. Placed under the photo
 * in the left column on the edit page and inline with the other fields in the right column on
 * the creation page, since creation has no photo/left column at all.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {boolean} context.hidden - Current `hidden` switch value.
 * @param {{onHiddenChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Hidden switch element.
 */
export default function PossessionHiddenField({ mode, hidden, handlers }) {
  const id = ID_KEYS[mode];

  return (
    <div className="form-check form-switch mb-3">
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="form-check-input"
        checked={hidden}
        onChange={handlers.onHiddenChange}
      />
      <label htmlFor={id} className="form-check-label">
        {Translator.t(LABEL_KEYS[mode])}
      </label>
    </div>
  );
}
