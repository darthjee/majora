import Modal from 'react-bootstrap/cjs/Modal.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Renders the "Token created" secret view of the create API token modal (issue #1605).
 */
export default class ApiTokenSecretViewHelper {
  /**
   * Render the secret view: warning, read-only token field, Copy, usage hint and Done. There is
   * no close button: only Done closes the modal.
   *
   * @param {{token: string, copyStatus: (string|null)}} state - The secret and copy status.
   * @param {{onCopy: Function, onDone: Function}} handlers - Copy and Done handlers.
   * @returns {React.ReactElement} Rendered secret view.
   */
  static render(state, handlers) {
    return (
      <>
        <Modal.Header>
          <Modal.Title>{Translator.t('api_tokens_page.created_title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-warning">{Translator.t('api_tokens_page.secret_warning')}</div>
          <div className="input-group mb-2">
            <input
              type="text"
              readOnly
              className="form-control font-monospace"
              aria-label={Translator.t('api_tokens_page.created_title')}
              data-testid="api-token-secret"
              value={state.token}
              onFocus={(event) => event.target.select()}
            />
            <button type="button" className="btn btn-outline-primary" onClick={handlers.onCopy}>
              {Translator.t('api_tokens_page.copy')}
            </button>
          </div>
          {ApiTokenSecretViewHelper.#renderCopyStatus(state)}
          <p className="form-text">{Translator.t('api_tokens_page.usage_hint')}</p>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-primary" onClick={handlers.onDone} data-testid="api-token-done">
            {Translator.t('api_tokens_page.done')}
          </button>
        </Modal.Footer>
      </>
    );
  }

  /**
   * Render the copy confirmation or the visible copy failure message.
   *
   * @param {{copyStatus: (string|null)}} state - Copy status.
   * @returns {React.ReactElement|null} Copy status message, or `null` before any copy.
   */
  static #renderCopyStatus(state) {
    if (state.copyStatus === 'copied') {
      return <p className="text-success small" data-testid="api-token-copied">{Translator.t('api_tokens_page.copied')}</p>;
    }

    if (state.copyStatus === 'failed') {
      return (
        <div className="alert alert-danger py-1" role="alert" data-testid="api-token-copy-failed">
          {Translator.t('api_tokens_page.copy_failed')}
        </div>
      );
    }

    return null;
  }
}
