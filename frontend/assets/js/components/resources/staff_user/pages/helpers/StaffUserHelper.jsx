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
   * @returns {React.ReactElement} User detail element.
   */
  static render(user, tokensState) {
    return (
      <div className="container mt-4">
        <BackButton href="#/staff/users" />
        <h1>{Translator.t('staff_user_page.title')}</h1>
        {StaffUserHelper.#renderDetails(user)}
        {StaffUserHelper.#renderRecoveryTokenPanel(tokensState)}
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
   * @param {object} tokensState - Token panel state (`tokens`, `tokensLoading`, `tokensError`).
   * @param {Array<object>} tokensState.tokens - Recovery-token rows.
   * @param {boolean} tokensState.tokensLoading - Whether the token panel is loading.
   * @param {boolean} tokensState.tokensError - Whether the token panel failed to load.
   * @returns {React.ReactElement} Recovery-token panel element.
   */
  static #renderRecoveryTokenPanel({ tokens, tokensLoading, tokensError }) {
    return (
      <div className="mt-4">
        <h2>{Translator.t('staff_user_page.recovery_tokens_title')}</h2>
        {tokensLoading && (
          <LoadingMessage message={Translator.t('staff_user_page.recovery_tokens_loading')} />
        )}
        {!tokensLoading && tokensError && (
          <ErrorAlert error={Translator.t('staff_user_page.recovery_tokens_error')} />
        )}
        {!tokensLoading && !tokensError && tokens.length === 0 && (
          <p>{Translator.t('staff_user_page.recovery_tokens_empty')}</p>
        )}
        {!tokensLoading && !tokensError && tokens.length > 0
          && StaffUserHelper.#renderTokenTable(tokens)}
      </div>
    );
  }

  /**
   * Render the recovery-token table: one row per token, status/created/expires/preview columns.
   *
   * @param {Array<object>} tokens - Recovery-token rows.
   * @returns {React.ReactElement} Token table element.
   */
  static #renderTokenTable(tokens) {
    return (
      <table className="table">
        <thead>
          <tr>
            <th>{Translator.t('staff_user_page.recovery_token_status_column')}</th>
            <th>{Translator.t('staff_user_page.recovery_token_created_column')}</th>
            <th>{Translator.t('staff_user_page.recovery_token_expires_column')}</th>
            <th>{Translator.t('staff_user_page.recovery_token_preview_column')}</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => {
            const badge = RecoveryTokenStatusBadges.build(token);
            return (
              <tr key={token.id}>
                <td><Badge variant={badge.variant} text={badge.text} /></td>
                <td>{token.created_at}</td>
                <td>{token.expires_at}</td>
                <td>{token.token_preview}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
