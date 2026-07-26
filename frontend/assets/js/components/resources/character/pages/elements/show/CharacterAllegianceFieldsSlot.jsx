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
 * Render the private-allegiance field (label + select), or `null` when the current viewer is
 * not a full (dm/admin) editor — players/staff only ever see the public-allegiance select.
 *
 * @param {boolean} isFullEditor - Whether the current viewer is a full (dm/admin) editor.
 * @param {string} idPrefix - Id prefix shared with the public-allegiance field.
 * @param {string} namespace - i18n namespace holding the field's labels/options.
 * @param {string} value - Current selected private-allegiance value.
 * @param {Function} onChange - Change handler for the select.
 * @returns {React.ReactElement|null} The private-allegiance field, or null.
 */
function renderPrivateAllegianceField(isFullEditor, idPrefix, namespace, value, onChange) {
  if (!isFullEditor) {
    return null;
  }

  return (
    <div className="mb-3">
      <label htmlFor={`${idPrefix}-allegiance`} className="form-label">
        {Translator.t(`${namespace}.private_allegiance_label`)}
      </label>
      {renderAllegianceSelect(`${idPrefix}-allegiance`, value, onChange, namespace)}
    </div>
  );
}

/**
 * Build the new/edit-mode private-allegiance/public-allegiance fields slot (NPC-only; PCs have
 * no allegiance concept), matching `BaseCharacterEditHelper#renderAllegianceFields`. The
 * private-allegiance select is only rendered for a full (dm/admin) editor (`isFullEditor`);
 * players/staff only ever see the public-allegiance select.
 *
 * @param {{edit: {namespace: string, idPrefix: string},
 *   new: {namespace: string, idPrefix: string}}} variants - Per-mode i18n namespace/id-prefix
 *   pair.
 * @returns {Function} New/edit-mode allegiance fields slot component.
 */
export function buildCharacterAllegianceFields(variants) {
  return function CharacterAllegianceFieldsEditOrNew({
    mode, privateAllegiance, publicAllegiance, isFullEditor, handlers,
  }) {
    const { namespace, idPrefix } = variants[mode];

    return (
      <>
        {renderPrivateAllegianceField(
          isFullEditor, idPrefix, namespace, privateAllegiance, handlers.onPrivateAllegianceChange,
        )}
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
