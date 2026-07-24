import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * New-mode right-column slot: the `hidden` switch, inline with the other fields (document
 * creation has no photo/left column at all, matching `ItemHiddenField`'s creation-page layout).
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {boolean} context.hidden - Current `hidden` switch value.
 * @param {{onHiddenChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Hidden switch element.
 */
export default function DocumentHiddenField({ hidden, handlers }) {
  return (
    <div className="form-check form-switch mb-3">
      <input
        id="document-new-hidden"
        type="checkbox"
        role="switch"
        className="form-check-input"
        checked={hidden}
        onChange={handlers.onHiddenChange}
      />
      <label htmlFor="document-new-hidden" className="form-check-label">
        {Translator.t('document_new_page.hidden_label')}
      </label>
    </div>
  );
}
