import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import ApiTokenRevokeConfirmModal from '../../../../common/api_tokens/ApiTokenRevokeConfirmModal.jsx';
import ApiTokensTable from '../elements/ApiTokensTable.jsx';
import ApiTokensRetryAlert from '../elements/ApiTokensRetryAlert.jsx';
import CreateApiTokenModal from '../elements/CreateApiTokenModal.jsx';
import Translator from '../../../../../i18n/Translator.js';

const NOTICE_VARIANTS = { token_gone: 'info', action_error: 'danger' };

/**
 * Rendering helper for the owner "API tokens" account page (issue #1605).
 */
export default class ApiTokensHelper {
  /**
   * Render the page: back link and "New token", intro, alerts, the token list and the revoke and
   * create modals.
   *
   * @param {{tokens: Array<object>, loading: boolean, error: boolean, options: (object|null),
   *   optionsError: boolean, notice: (string|null), renaming: (object|null),
   *   revokeTarget: (object|null), revoking: boolean, showCreate: boolean}} state - Page state.
   * @param {object} handlers - Page handlers (retry, create, rename and revoke).
   * @returns {React.ReactElement} Rendered page.
   */
  static render(state, handlers) {
    return (
      <div className="container mt-4" data-testid="api-tokens-page">
        <PageActions backHref="#/my_account">
          <button
            type="button"
            className="btn btn-primary ms-2"
            data-testid="api-tokens-new"
            disabled={!state.options}
            onClick={handlers.onOpenCreate}
          >
            {Translator.t('api_tokens_page.new_token')}
          </button>
        </PageActions>
        <h1>{Translator.t('api_tokens_page.title')}</h1>
        <p>{Translator.t('api_tokens_page.intro')}</p>
        {ApiTokensHelper.#renderOptionsError(state, handlers)}
        {ApiTokensHelper.#renderNotice(state)}
        {ApiTokensHelper.#renderList(state, handlers)}
        <ApiTokenRevokeConfirmModal
          show={Boolean(state.revokeTarget)}
          tokenName={state.revokeTarget?.name}
          submitting={state.revoking}
          onConfirm={handlers.onRevokeConfirm}
          onCancel={handlers.onRevokeCancel}
        />
        <CreateApiTokenModal
          show={state.showCreate}
          options={state.options}
          onCancel={handlers.onCloseCreate}
          onCreated={handlers.onCreated}
        />
      </div>
    );
  }

  /**
   * Render the options failure alert with a retry.
   *
   * @param {{optionsError: boolean}} state - Page state.
   * @param {{onRetry: Function}} handlers - Retry handler.
   * @returns {React.ReactElement|null} Alert, or `null`.
   */
  static #renderOptionsError(state, handlers) {
    if (!state.optionsError) return null;

    return (
      <ApiTokensRetryAlert
        variant="warning"
        message={Translator.t('api_tokens_page.options_error')}
        onRetry={handlers.onRetry}
        testId="api-tokens-options-error"
      />
    );
  }

  /**
   * Render the `token_gone` info or `action_error` notice.
   *
   * @param {{notice: (string|null)}} state - Page state.
   * @returns {React.ReactElement|null} Alert, or `null`.
   */
  static #renderNotice(state) {
    if (!state.notice) return null;

    return (
      <div className={`alert alert-${NOTICE_VARIANTS[state.notice]}`} role="alert" data-testid="api-tokens-notice">
        {Translator.t(`api_tokens_page.${state.notice}`)}
      </div>
    );
  }

  /**
   * Render the list area: loading, load error with retry, empty state or the table.
   *
   * @param {object} state - Page state.
   * @param {object} handlers - Page handlers.
   * @returns {React.ReactElement} List area.
   */
  static #renderList(state, handlers) {
    if (state.loading) return <LoadingMessage message={Translator.t('api_tokens_page.loading')} />;

    if (state.error) {
      return (
        <ApiTokensRetryAlert
          variant="danger"
          message={Translator.t('api_tokens_page.load_error')}
          onRetry={handlers.onRetry}
          testId="api-tokens-load-error"
        />
      );
    }

    if (state.tokens.length === 0) {
      return <p data-testid="api-tokens-empty">{Translator.t('api_tokens_page.empty')}</p>;
    }

    return <ApiTokensTable tokens={state.tokens} renaming={state.renaming} handlers={handlers} />;
  }
}
