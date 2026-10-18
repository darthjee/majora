import Modal from 'react-bootstrap/cjs/Modal.js';
import FieldErrors from '../../../../../common/forms/FieldErrors.jsx';
import ApiTokenScopePicker from '../ApiTokenScopePicker.jsx';
import ApiTokenGamesPicker from '../ApiTokenGamesPicker.jsx';
import ApiTokenExpiryField from '../ApiTokenExpiryField.jsx';
import ApiTokenSecretView from '../ApiTokenSecretView.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import Noop from '../../../../../../utils/Noop.js';

const EMPTY_OPTIONS = { scopes: [], games: [], all_games: false };

/**
 * Renders the create API token modal (issue #1605).
 */
export default class CreateApiTokenModalHelper {
  /**
   * Render the modal shell, in the form view or, once created, the static secret view.
   *
   * @param {{show: boolean, form: object, fieldErrors: object, status: string,
   *   secret: ({token: string, name: string}|null), copyStatus: (string|null),
   *   options: (object|null), canSubmit: boolean}} state - Modal state.
   * @param {object} handlers - Form, copy and Done handlers.
   * @returns {React.ReactElement} Rendered modal.
   */
  static render(state, handlers) {
    if (state.secret) {
      return (
        <Modal show={state.show} onHide={Noop.noop} backdrop="static" keyboard={false} size="lg">
          <ApiTokenSecretView
            token={state.secret.token}
            copyStatus={state.copyStatus}
            onCopy={handlers.onCopy}
            onDone={handlers.onDone}
          />
        </Modal>
      );
    }

    return (
      <Modal show={state.show} onHide={handlers.onCancel} size="lg">
        <form onSubmit={handlers.onSubmit} noValidate>
          <Modal.Header closeButton>
            <Modal.Title>{Translator.t('api_tokens_page.create_title')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>{CreateApiTokenModalHelper.#renderFields(state, handlers)}</Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn btn-secondary" onClick={handlers.onCancel}>
              {Translator.t('api_tokens_page.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!state.canSubmit}
              data-testid="api-token-create-submit"
            >
              {Translator.t('api_tokens_page.create')}
            </button>
          </Modal.Footer>
        </form>
      </Modal>
    );
  }

  /**
   * Render the form fields and the generic error.
   *
   * @param {object} state - Modal state (see `render`).
   * @param {object} handlers - Field change handlers.
   * @returns {React.ReactElement} Form fields.
   */
  static #renderFields(state, handlers) {
    const { form, fieldErrors } = state;
    const options = state.options ?? EMPTY_OPTIONS;

    return (
      <>
        {CreateApiTokenModalHelper.#renderGenericError(state)}
        <div className="mb-3">
          <label htmlFor="api-token-name" className="form-label">{Translator.t('api_tokens_page.name_label')}</label>
          <input
            id="api-token-name"
            type="text"
            className="form-control"
            maxLength={100}
            value={form.name}
            onChange={handlers.onNameChange}
          />
          <FieldErrors errors={fieldErrors.name ?? []} />
        </div>
        <ApiTokenScopePicker
          value={form.scopes}
          scopes={options.scopes}
          onChange={handlers.onScopesChange}
          errors={fieldErrors}
        />
        <ApiTokenGamesPicker value={form.games} options={options} onChange={handlers.onGamesChange} errors={fieldErrors} />
        <ApiTokenExpiryField value={form.expiry} onChange={handlers.onExpiryChange} errors={fieldErrors} />
      </>
    );
  }

  /**
   * Render the generic error after a non-400 failure.
   *
   * @param {{status: string}} state - Modal state.
   * @returns {React.ReactElement|null} Error alert, or `null`.
   */
  static #renderGenericError(state) {
    if (state.status !== 'error') return null;

    return (
      <div className="alert alert-danger" role="alert" data-testid="api-token-create-error">
        {Translator.t('api_tokens_page.generic_error')}
      </div>
    );
  }
}
