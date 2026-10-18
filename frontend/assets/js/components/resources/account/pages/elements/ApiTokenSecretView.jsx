import ApiTokenSecretViewHelper from './helpers/ApiTokenSecretViewHelper.jsx';

/**
 * The "Token created" view of the create API token modal (issue #1605): the one-time secret,
 * a Copy button, a usage hint and a Done button. Rendered inside the static modal shell.
 *
 * @param {object} props - Component props.
 * @param {string} props.token - The plain token secret.
 * @param {(string|null)} props.copyStatus - `'copied'`, `'failed'` or `null`.
 * @param {Function} props.onCopy - Copy button handler.
 * @param {Function} props.onDone - Done button handler.
 * @returns {React.ReactElement} Rendered secret view.
 */
export default function ApiTokenSecretView({
  token, copyStatus, onCopy, onDone,
}) {
  return ApiTokenSecretViewHelper.render({ token, copyStatus }, { onCopy, onDone });
}
