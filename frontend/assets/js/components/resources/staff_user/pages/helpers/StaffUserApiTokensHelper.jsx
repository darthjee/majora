import React from 'react';
import ApiTokenCellsHelper from '../../../../common/api_tokens/ApiTokenCellsHelper.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import Translator from '../../../../../i18n/Translator.js';

const COLUMNS = ['name', 'prefix', 'scopes', 'games', 'expires', 'last_used', 'created', 'status'];

/**
 * Rendering helper for the staff user page's read-only "API tokens" panel (issue #1606).
 *
 * @description Builds its rows from the shared `ApiTokenCellsHelper`, so the cells match the
 *   owner list exactly, but carries no rename, no create and no "Revoke all": the only action is
 *   a per-row Revoke, which prompts through `onRevokePrompt`.
 */
export default class StaffUserApiTokensHelper {
  /**
   * Render the panel: its title, the revoke notice and the list body.
   *
   * @param {object} state - Panel state, independent of the user's own loading/error state.
   * @param {Array<object>} state.tokens - API token rows, in API order.
   * @param {boolean} state.loading - Whether the panel is loading.
   * @param {boolean} state.error - Whether the panel failed to load.
   * @param {(string|null)} state.notice - `'token_gone'`, `'action_error'` or `null`.
   * @param {{onRevokePrompt: Function}} handlers - Row handlers; `onRevokePrompt(token)` opens
   *   the revoke confirmation.
   * @returns {React.ReactElement} API tokens panel element.
   */
  static render({
    tokens, loading, error, notice,
  }, handlers) {
    return (
      <div className="mt-4" data-testid="staff-user-api-tokens">
        <h2>{Translator.t('staff_user_page.api_tokens_title')}</h2>
        {StaffUserApiTokensHelper.#renderNotice(notice)}
        {StaffUserApiTokensHelper.#renderBody({ tokens, loading, error }, handlers)}
      </div>
    );
  }

  /**
   * Render the revoke notice: an info alert when the token was already gone, an error alert when
   * the revoke failed.
   *
   * @param {(string|null)} notice - `'token_gone'`, `'action_error'` or `null`.
   * @returns {React.ReactElement|null} Notice alert, or `null`.
   */
  static #renderNotice(notice) {
    if (notice === 'token_gone') {
      return (
        <div className="alert alert-info" role="alert" data-testid="staff-user-api-tokens-notice">
          {Translator.t('api_tokens_page.token_gone')}
        </div>
      );
    }

    if (notice === 'action_error') {
      return <ErrorAlert error={Translator.t('staff_user_page.api_tokens_action_error')} />;
    }

    return null;
  }

  /**
   * Render the panel body: loading message, error alert, empty message or the table.
   *
   * @param {{tokens: Array<object>, loading: boolean, error: boolean}} state - Panel state.
   * @param {{onRevokePrompt: Function}} handlers - Row handlers.
   * @returns {React.ReactElement} Panel body.
   */
  static #renderBody({ tokens, loading, error }, handlers) {
    if (loading) {
      return <LoadingMessage message={Translator.t('staff_user_page.api_tokens_loading')} />;
    }

    if (error) {
      return <ErrorAlert error={Translator.t('staff_user_page.api_tokens_error')} />;
    }

    if (tokens.length === 0) {
      return <p>{Translator.t('staff_user_page.api_tokens_empty')}</p>;
    }

    return StaffUserApiTokensHelper.#renderTable(tokens, handlers);
  }

  /**
   * Render the token table: the shared columns plus a single Revoke action per row.
   *
   * @param {Array<object>} tokens - API token rows, in API order.
   * @param {{onRevokePrompt: Function}} handlers - Row handlers.
   * @returns {React.ReactElement} Token table element.
   */
  static #renderTable(tokens, handlers) {
    return (
      <div className="table-responsive">
        <table className="table align-middle" data-testid="staff-user-api-tokens-table">
          <thead>
            <tr>
              {COLUMNS.map((column) => <th key={column}>{Translator.t(`api_tokens_page.col_${column}`)}</th>)}
              <th>{Translator.t('staff_user_page.api_tokens_actions_column')}</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.id} data-testid={`staff-user-api-token-row-${token.id}`}>
                <td>{ApiTokenCellsHelper.renderName(token)}</td>
                <td>{ApiTokenCellsHelper.renderPrefix(token)}</td>
                <td>{ApiTokenCellsHelper.renderScopes(token)}</td>
                <td>{ApiTokenCellsHelper.renderGames(token)}</td>
                <td>{ApiTokenCellsHelper.renderExpires(token)}</td>
                <td>{ApiTokenCellsHelper.renderLastUsed(token)}</td>
                <td>{ApiTokenCellsHelper.renderCreated(token)}</td>
                <td>{ApiTokenCellsHelper.renderStatus(token)}</td>
                <td className="text-nowrap">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handlers.onRevokePrompt(token)}
                  >
                    {Translator.t('api_tokens_page.revoke')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
