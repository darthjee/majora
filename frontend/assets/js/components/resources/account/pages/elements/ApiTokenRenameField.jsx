import FieldErrors from '../../../../common/forms/FieldErrors.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Build the inline rename input's `keydown` handler: Enter saves, Esc cancels. Exported so it
 * can be exercised directly in specs.
 *
 * @param {Function} onSave - Called when Enter is pressed.
 * @param {Function} onCancel - Called when Escape is pressed.
 * @returns {Function} `(event) => void` keydown handler.
 */
export function buildRenameKeyDownHandler(onSave, onCancel) {
  return (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSave();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  };
}

/**
 * Inline rename input of an API token row (issue #1605), with its `name` field errors.
 *
 * @param {object} props - Component props.
 * @param {string} props.value - Current name being edited.
 * @param {Array<string>} [props.errors] - `name` field error codes.
 * @param {Function} props.onChange - Called with the new name.
 * @param {Function} props.onSave - Called when Enter is pressed.
 * @param {Function} props.onCancel - Called when Escape is pressed.
 * @returns {React.ReactElement} Rendered rename field.
 */
export default function ApiTokenRenameField({
  value, errors = [], onChange, onSave, onCancel,
}) {
  return (
    <div>
      <input
        type="text"
        className="form-control form-control-sm"
        data-testid="api-token-rename-input"
        aria-label={Translator.t('api_tokens_page.name_label')}
        maxLength={100}
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={buildRenameKeyDownHandler(onSave, onCancel)}
      />
      <FieldErrors errors={errors} />
    </div>
  );
}
