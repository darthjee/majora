import Translator from '../../../../../i18n/Translator.js';

/**
 * One Read or Write checkbox of the API token scope picker (issue #1605).
 *
 * @description Renders nothing when the scope is not in the `options.json` catalogue, so only
 *   real scopes are ever offered.
 * @param {object} props - Component props.
 * @param {string} props.family - Scope family, e.g. `'npcs'`.
 * @param {string} props.action - `'read'` or `'write'`.
 * @param {boolean} props.available - Whether `<family>:<action>` is in the catalogue.
 * @param {boolean} props.checked - Whether the scope is selected.
 * @param {Function} props.onToggle - Called with `(scope, checked)` on change.
 * @returns {React.ReactElement|null} The checkbox, or `null` when unavailable.
 */
export default function ApiTokenScopeCheckbox({
  family, action, available, checked, onToggle,
}) {
  if (!available) return null;

  const scope = `${family}:${action}`;
  const label = `${Translator.t(`api_tokens_page.family_${family}`)} ${Translator.t(`api_tokens_page.${action}`)}`;

  return (
    <input
      type="checkbox"
      className="form-check-input"
      id={`api-token-scope-${family}-${action}`}
      data-testid={`api-token-scope-${scope}`}
      aria-label={label}
      checked={checked}
      onChange={(event) => onToggle(scope, event.target.checked)}
    />
  );
}
