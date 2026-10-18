import ApiTokenExpiryFieldHelper from './helpers/ApiTokenExpiryFieldHelper.jsx';
import ApiTokenExpiry from './ApiTokenExpiry.js';

/**
 * Controlled expiry field of the create API token form (issue #1605): 30 days, 90 days
 * (default), a custom date or never.
 *
 * @param {object} props - Component props.
 * @param {{choice: string, customDate: string}} props.value - Current expiry state.
 * @param {Function} props.onChange - Called with the new expiry state.
 * @param {object} [props.errors] - Form field errors (`expires_at` is used).
 * @returns {React.ReactElement} Rendered expiry field.
 */
export default function ApiTokenExpiryField({ value, onChange, errors = {} }) {
  return ApiTokenExpiryFieldHelper.render(
    { value, minDate: ApiTokenExpiry.minDate(), errors: errors.expires_at ?? [] },
    {
      onChoiceChange: (choice) => onChange({ ...value, choice }),
      onDateChange: (customDate) => onChange({ ...value, customDate }),
    },
  );
}
