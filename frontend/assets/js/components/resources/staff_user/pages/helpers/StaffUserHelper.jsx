import React from 'react';
import BackButton from '../../../../common/buttons/BackButton.jsx';
import Badge from '../../../../common/badges/Badge.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import Translator from '../../../../../i18n/Translator.js';
import StaffUserStatusBadges from '../../../../common/list_types/StaffUserStatusBadges.js';
import RecoveryTokenStatusBadges from '../../../../common/list_types/RecoveryTokenStatusBadges.js';

/**
 * Rendering helper for the staff user detail page.
 */
export default class StaffUserHelper {
  /**
   * Render the user detail view, composed of the details block, the recovery-token panel, and the
   * edit action.
   *
   * @param {object} user - User data object.
   * @param {number} user.id - User id.
   * @param {string} user.name - User name.
   * @param {string} user.email - User email.
   * @param {string} user.status - User status (`'pending'`, `'approved'`, or `'denied'`).
   * @param {object} tokensState - Recovery-token panel state, independent of `user`'s own
   *   loading/error state.
   * @param {Array<object>} tokensState.tokens - Recovery-token rows.
   * @param {boolean} tokensState.tokensLoading - Whether the token panel is loading.
   * @param {boolean} tokensState.tokensError - Whether the token panel failed to load.
   * @param {boolean} tokensState.actionError - Whether the last row/panel action failed (issue
   *   #1249), shown as a transient alert above the still-visible table.
   * @param {{onUnexpire: Function, onForceExpirePrompt: Function, onDeletePrompt: Function,
   *   onGenerateRecoveryLink: Function}} handlers - Recovery-token panel action handlers (issue
   *   #1249).
   * @returns {React.ReactElement} User detail element.
   */
  static render(user, tokensState, handlers) {
    return (
      <div className="container mt-4">
        <BackButton href="#/staff/users" />
        <h1>{Translator.t('staff_user_page.title')}</h1>
        {StaffUserHelper.#renderDetails(user)}
        {StaffUserHelper.#renderRecoveryTokenPanel(tokensState, handlers)}
        {StaffUserHelper.#renderEditAction(user)}
      </div>
    );
  }

  /**
   * Render the details block: the name paragraph, the email paragraph, and the status row.
   *
   * @param {object} user - User data object (`name`, `email`, `status`).
   * @returns {React.ReactElement} Details block element.
   */
  static #renderDetails(user) {
    const badge = StaffUserStatusBadges.build(user.status);

    return (
      <>
        <p>
          <strong>{Translator.t('staff_user_page.name_label')}</strong>
          {' '}
          {user.name}
        </p>
        <p>
          <strong>{Translator.t('staff_user_page.email_label')}</strong>
          {' '}
          {user.email}
        </p>
        <p>
          <strong>{Translator.t('staff_user_page.status_label')}</strong>
          {' '}
          <Badge variant={badge.variant} text={badge.text} />
        </p>
      </>
    );
  }

  /**
   * Render the recovery-token panel: its own loading/error/empty/table states, independent of
   * the details block above it (a token-fetch failure never blanks the name/email/status block).
   *
   * @param {object} tokensState - Token panel state (`tokens`, `tokensLoading`, `tokensError`,
   *   `actionError`).
   * @param {Array<object>} tokensState.tokens - Recovery-token rows.
   * @param {boolean} tokensState.tokensLoading - Whether the token panel is loading.
   * @param {boolean} tokensState.tokensError - Whether the token panel failed to load.
   * @param {boolean} tokensState.actionError - Whether the last row/panel action failed (issue
   *   #1249).
   * @param {{onUnexpire: Function, onForceExpirePrompt: Function, onDeletePrompt: Function,
   *   onGenerateRecoveryLink: Function}} handlers - Recovery-token panel action handlers.
   * @returns {React.ReactElement} Recovery-token panel element.
   */
  static #renderRecoveryTokenPanel({
    tokens, tokensLoading, tokensError, actionError,
  }, handlers) {
    return (
      <div className="mt-4">
        <h2>{Translator.t('staff_user_page.recovery_tokens_title')}</h2>
        <button
          type="button"
          className="btn btn-primary btn-sm mb-3"
          onClick={handlers.onGenerateRecoveryLink}
        >
          {Translator.t('staff_user_page.recovery_token_generate_button')}
        </button>
        {actionError && (
          <ErrorAlert error={Translator.t('staff_user_page.recovery_token_action_error')} />
        )}
        {StaffUserHelper.#renderTokenListBody({ tokens, tokensLoading, tokensError }, handlers)}
      </div>
    );
  }

  /**
   * Render the recovery-token panel's own loading/error/empty/table states.
   *
   * @param {object} tokensState - Token panel state (`tokens`, `tokensLoading`, `tokensError`).
   * @param {Array<object>} tokensState.tokens - Recovery-token rows.
   * @param {boolean} tokensState.tokensLoading - Whether the token panel is loading.
   * @param {boolean} tokensState.tokensError - Whether the token panel failed to load.
   * @param {{onUnexpire: Function, onForceExpirePrompt: Function, onDeletePrompt: Function}}
   *   handlers - Row action handlers.
   * @returns {React.ReactElement} Loading message, error alert, empty message, or token table.
   */
  static #renderTokenListBody({ tokens, tokensLoading, tokensError }, handlers) {
    if (tokensLoading) {
      return <LoadingMessage message={Translator.t('staff_user_page.recovery_tokens_loading')} />;
    }

    if (tokensError) {
      return <ErrorAlert error={Translator.t('staff_user_page.recovery_tokens_error')} />;
    }

    if (tokens.length === 0) {
      return <p>{Translator.t('staff_user_page.recovery_tokens_empty')}</p>;
    }

    return StaffUserHelper.#renderTokenTable(tokens, handlers);
  }

  /**
   * Render the recovery-token table: one row per token, status/created/expires/preview/actions
   * columns.
   *
   * @param {Array<object>} tokens - Recovery-token rows.
   * @param {{onUnexpire: Function, onForceExpirePrompt: Function, onDeletePrompt: Function}}
   *   handlers - Row action handlers.
   * @returns {React.ReactElement} Token table element.
   */
  static #renderTokenTable(tokens, handlers) {
    return (
      <table className="table">
        <thead>
          <tr>
            <th>{Translator.t('staff_user_page.recovery_token_status_column')}</th>
            <th>{Translator.t('staff_user_page.recovery_token_created_column')}</th>
            <th>{Translator.t('staff_user_page.recovery_token_expires_column')}</th>
            <th>{Translator.t('staff_user_page.recovery_token_preview_column')}</th>
            <th>{Translator.t('staff_user_page.recovery_token_actions_column')}</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => {
            const badge = RecoveryTokenStatusBadges.build(token);
            const status = RecoveryTokenStatusBadges.computeStatus(token);
            return (
              <tr key={token.id}>
                <td><Badge variant={badge.variant} text={badge.text} /></td>
                <td>{token.created_at}</td>
                <td>{token.expires_at}</td>
                <td>{token.token_preview}</td>
                <td>{StaffUserHelper.#renderRowActions(token, status, handlers)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  /**
   * Render a single token row's action buttons, per its computed status.
   *
   * @param {object} token - Token row object (`id`).
   * @param {string} status - The row's computed status (`'used'`, `'revoked'`, `'expired'`, or
   *   `'valid'`).
   * @param {{onUnexpire: Function, onForceExpirePrompt: Function, onDeletePrompt: Function}}
   *   handlers - Row action handlers.
   * @returns {React.ReactElement} Row action buttons.
   */
  static #renderRowActions(token, status, handlers) {
    return (
      <>
        {(status === 'expired' || status === 'revoked') && (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm me-2"
            onClick={() => handlers.onUnexpire(token.id)}
          >
            {Translator.t('staff_user_page.recovery_token_action_unexpire')}
          </button>
        )}
        {status === 'valid' && (
          <button
            type="button"
            className="btn btn-outline-warning btn-sm me-2"
            onClick={() => handlers.onForceExpirePrompt(token.id)}
          >
            {Translator.t('staff_user_page.recovery_token_action_force_expire')}
          </button>
        )}
        <button
          type="button"
          className="btn btn-outline-danger btn-sm"
          onClick={() => handlers.onDeletePrompt(token.id)}
        >
          {Translator.t('staff_user_page.recovery_token_action_delete')}
        </button>
      </>
    );
  }

  /**
   * Render the edit action linking to the staff user edit page.
   *
   * @param {object} user - User data object (`id`).
   * @returns {React.ReactElement} Edit link element.
   */
  static #renderEditAction(user) {
    return (
      <a href={`#/staff/users/${user.id}/edit`} className="btn btn-secondary">
        {Translator.t('staff_user_page.edit')}
      </a>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('staff_user_page.loading')} />;
  }

  /**
   * Render the error state.
   *
   * @returns {React.ReactElement} Error alert.
   */
  static renderError() {
    return <ErrorAlert error={Translator.t('staff_user_page.error')} />;
  }
}
