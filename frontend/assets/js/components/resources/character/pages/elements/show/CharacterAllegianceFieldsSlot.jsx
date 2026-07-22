import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Render a single allegiance `<select>`, shared by the real and public allegiance fields.
 *
 * @param {string} id - Id shared between the label's `htmlFor` and the select.
 * @param {string} value - Current selected value.
 * @param {Function} onChange - Change handler for the select.
 * @param {string} namespace - i18n namespace holding the `allegiance_ally/enemy/neutral` keys.
 * @returns {React.ReactElement} Allegiance select element.
 */
function renderAllegianceSelect(id, value, onChange, namespace) {
  return (
    <select id={id} className="form-select" value={value} onChange={onChange}>
      <option value="ally">{Translator.t(`${namespace}.allegiance_ally`)}</option>
      <option value="enemy">{Translator.t(`${namespace}.allegiance_enemy`)}</option>
      <option value="neutral">{Translator.t(`${namespace}.allegiance_neutral`)}</option>
    </select>
  );
}

/**
 * Build the new/edit-mode allegiance/public-allegiance fields slot (NPC-only; PCs have no
 * allegiance concept), matching `BaseCharacterEditHelper#renderAllegianceFields`.
 *
 * @param {{edit: {namespace: string, idPrefix: string},
 *   new: {namespace: string, idPrefix: string}}} variants - Per-mode i18n namespace/id-prefix
 *   pair.
 * @returns {Function} New/edit-mode allegiance fields slot component.
 */
export function buildCharacterAllegianceFields(variants) {
  return function CharacterAllegianceFieldsEditOrNew({
    mode, allegiance, publicAllegiance, handlers,
  }) {
    const { namespace, idPrefix } = variants[mode];

    return (
      <>
        <div className="mb-3">
          <label htmlFor={`${idPrefix}-allegiance`} className="form-label">
            {Translator.t(`${namespace}.allegiance_label`)}
          </label>
          {renderAllegianceSelect(`${idPrefix}-allegiance`, allegiance, handlers.onAllegianceChange, namespace)}
        </div>
        <div className="mb-3">
          <label htmlFor={`${idPrefix}-public-allegiance`} className="form-label">
            {Translator.t(`${namespace}.public_allegiance_label`)}
          </label>
          {renderAllegianceSelect(
            `${idPrefix}-public-allegiance`, publicAllegiance, handlers.onPublicAllegianceChange, namespace,
          )}
        </div>
      </>
    );
  };
}

export default buildCharacterAllegianceFields;
