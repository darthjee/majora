import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Build the new/edit-mode `hidden` switch slot (NPC-only; PCs have no hidden concept). Gated on
 * `isFullEditor`, matching `BaseCharacterEditHelper#renderHiddenField` (creation is always
 * performed by a full editor, so it's always visible there).
 *
 * @param {{edit: {id: string, label: string}, new: {id: string, label: string}}} variants -
 *   Per-mode `id`/label i18n key pair.
 * @returns {Function} New/edit-mode hidden switch slot component.
 */
export function buildCharacterHiddenField(variants) {
  return function CharacterHiddenEditOrNew({
    mode, hidden, isFullEditor, handlers,
  }) {
    if (!isFullEditor) return null;

    const { id, label } = variants[mode];

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
          {Translator.t(label)}
        </label>
      </div>
    );
  };
}

export default buildCharacterHiddenField;
