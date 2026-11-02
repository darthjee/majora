import Translator from '../../../i18n/Translator.js';

/**
 * Page-level fallback shown by `AppErrorBoundary` once a render error escaped the app tree:
 * a Bootstrap danger alert with a translated title/message and a reload button. No error
 * details are ever shown to the user.
 *
 * @param {object} props - Component props.
 * @param {Function} props.onReload - Called when the reload button is clicked.
 * @returns {React.ReactElement} Fallback alert element.
 */
export default function AppErrorFallback({ onReload }) {
  return (
    <div className="container mt-4">
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">
          {Translator.t('error_boundary.title', 'Something went wrong')}
        </h4>
        <p>
          {Translator.t(
            'error_boundary.message', 'An unexpected error occurred while rendering this page.',
          )}
        </p>
        <button type="button" className="btn btn-outline-danger" onClick={onReload}>
          {Translator.t('error_boundary.reload', 'Reload page')}
        </button>
      </div>
    </div>
  );
}
