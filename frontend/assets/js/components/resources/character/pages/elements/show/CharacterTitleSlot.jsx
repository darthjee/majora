import React from 'react';
import ErrorAlert from '../../../../../common/misc/ErrorAlert.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Build the new/edit-mode right-column title slot for a character kind: the page's title, a
 * submission error alert when the last submit attempt failed, and (optionally) any extra
 * mode-specific content rendered right below it.
 *
 * @param {{edit: {title: string, error: string}, new: {title: string, error: string}}} variants -
 *   Per-mode title/error i18n key pair, keyed by `'edit'` and/or `'new'` (PCs only ever provide
 *   `'edit'`).
 * @param {Function|null} [ExtraComponent] - Optional component, rendered with the full context as
 *   props, for extra mode-specific content below the title/error (e.g. NPC creation's
 *   photo-upload-failure alert, a no-op in every other mode).
 * @returns {Function} New/edit-mode title slot component.
 */
export function buildCharacterTitleField(variants, ExtraComponent = null) {
  return function CharacterTitleEditOrNew(context) {
    const { mode, status } = context;
    const { title, error } = variants[mode];

    return (
      <>
        <h1>{Translator.t(title)}</h1>
        {status === 'error' && <ErrorAlert error={Translator.t(error)} />}
        {ExtraComponent && <ExtraComponent {...context} />}
      </>
    );
  };
}

export default buildCharacterTitleField;
