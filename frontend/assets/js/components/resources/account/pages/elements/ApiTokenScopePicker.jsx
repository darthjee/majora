import ApiTokenScopePickerHelper from './helpers/ApiTokenScopePickerHelper.jsx';
import ApiTokenScopeSelection from './ApiTokenScopeSelection.js';

/**
 * Controlled scope picker of the create API token form (issue #1605): one row per family,
 * grouped under headings, with Read and Write checkboxes and the select-all/clear shortcuts.
 *
 * @param {object} props - Component props.
 * @param {Array<string>} props.value - Selected scopes.
 * @param {Array<string>} props.scopes - Scope catalogue from `options.json`.
 * @param {Function} props.onChange - Called with the new selection.
 * @param {object} [props.errors] - Form field errors (`scopes` is used).
 * @returns {React.ReactElement} Rendered scope picker.
 */
export default function ApiTokenScopePicker({
  value, scopes, onChange, errors = {},
}) {
  return ApiTokenScopePickerHelper.render(
    { value, scopes, errors: errors.scopes ?? [] },
    {
      onToggle: (scope, checked) => onChange(ApiTokenScopeSelection.toggle(value, scope, checked, scopes)),
      onSelectAllRead: () => onChange(ApiTokenScopeSelection.selectAll(value, scopes, 'read')),
      onSelectAllWrite: () => onChange(ApiTokenScopeSelection.selectAll(value, scopes, 'write')),
      onClear: () => onChange(ApiTokenScopeSelection.clear()),
    },
  );
}
