import Translator from '../../../i18n/Translator.js';

/**
 * Bootstrap danger alerts rendered below a form field, one per error code. Each code is
 * resolved to localized text via `Translator.t('errors.<code>')`, falling back to the raw
 * code string when no translation entry exists.
 *
 * @param {object} props - Component props.
 * @param {string[]} props.errors - Field-level error codes to display.
 * @returns {React.ReactElement[]} Rendered error alert elements.
 */
export default function FieldErrors({ errors }) {
  return errors.map((code) => (
    <div key={code} className="alert alert-danger mt-1 mb-0 py-1">
      {Translator.t(`errors.${code}`, code)}
    </div>
  ));
}
