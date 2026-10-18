import Translator from '../../../../../i18n/Translator.js';

/**
 * Alert with a Retry button, used by the API tokens page (issue #1605) for both the list load
 * failure and the options load failure.
 *
 * @param {object} props - Component props.
 * @param {string} props.variant - Bootstrap alert variant (e.g. `'danger'`, `'warning'`).
 * @param {string} props.message - Translated message.
 * @param {Function} props.onRetry - Retry button handler.
 * @param {string} props.testId - `data-testid` of the alert.
 * @returns {React.ReactElement} Rendered alert.
 */
export default function ApiTokensRetryAlert({
  variant, message, onRetry, testId,
}) {
  return (
    <div className={`alert alert-${variant} d-flex align-items-center gap-2`} data-testid={testId}>
      <span>{message}</span>
      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onRetry}>
        {Translator.t('api_tokens_page.retry')}
      </button>
    </div>
  );
}
