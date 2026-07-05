import React from 'react';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
import PageActions from '../../elements/PageActions.jsx';
import Pagination from '../../elements/Pagination.jsx';
import Table from '../../elements/Table.jsx';
import Translator from '../../../i18n/Translator.js';

/**
 * Rendering helper for the staff users listing page.
 */
export default class StaffUsersHelper {
  /**
   * Render the users list with pagination and per-row recovery-link actions.
   *
   * @param {object[]} users - List of user objects (`id`, `name`, `email`).
   * @param {object} pagination - Pagination metadata.
   * @param {number} pagination.page - Current page.
   * @param {number} pagination.pages - Total pages.
   * @param {number} pagination.perPage - Items per page.
   * @param {object} recoveryLinks - Recovery link state map, keyed by user id.
   * @param {{onGenerateRecoveryLink: Function, onCopyRecoveryLink: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Users list with pagination.
   */
  static render(users, pagination, recoveryLinks, handlers) {
    const columns = [
      { key: 'name', label: Translator.t('staff_users_page.name_column') },
      { key: 'email', label: Translator.t('staff_users_page.email_column') },
    ];

    return (
      <div className="container mt-4">
        <PageActions backHref="#/" />
        <h1>{Translator.t('staff_users_page.title')}</h1>
        <Table
          columns={columns}
          rows={users}
          renderActions={(user) => (
            StaffUsersHelper.#renderRowActions(user, recoveryLinks, handlers)
          )}
        />
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          perPage={pagination.perPage}
          basePath="#/staff/users"
        />
      </div>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('staff_users_page.loading')} />;
  }

  /**
   * Render the error state.
   *
   * @param {string} error - Error message.
   * @returns {React.ReactElement} Error alert.
   */
  static renderError(error) {
    return <ErrorAlert error={error} />;
  }

  /**
   * Render the per-row edit link and recovery-link action.
   *
   * @param {object} user - User row object.
   * @param {object} recoveryLinks - Recovery link state map, keyed by user id.
   * @param {{onGenerateRecoveryLink: Function, onCopyRecoveryLink: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Row actions.
   */
  static #renderRowActions(user, recoveryLinks, handlers) {
    const recovery = recoveryLinks[user.id] ?? { status: 'idle', url: null };

    return (
      <>
        <a href={`#/staff/users/${user.id}/edit`} className="btn btn-secondary btn-sm me-2">
          {Translator.t('staff_users_page.edit')}
        </a>
        {StaffUsersHelper.#renderRecoveryAction(user, recovery, handlers)}
      </>
    );
  }

  /**
   * Render the recovery-link action for a single row, depending on its current status.
   *
   * @param {object} user - User row object.
   * @param {{status: string, url: (string|null)}} recovery - Recovery link state for this user.
   * @param {{onGenerateRecoveryLink: Function, onCopyRecoveryLink: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Recovery-link action controls.
   */
  static #renderRecoveryAction(user, recovery, handlers) {
    if (recovery.status === 'ready' || recovery.status === 'copied') {
      return StaffUsersHelper.#renderRecoveryLink(user, recovery, handlers);
    }

    return (
      <>
        {recovery.status === 'error' && (
          <span className="text-danger me-2">{Translator.t('staff_users_page.link_error')}</span>
        )}
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={recovery.status === 'loading'}
          onClick={() => handlers.onGenerateRecoveryLink(user.id)}
        >
          {Translator.t('staff_users_page.generate_link')}
        </button>
      </>
    );
  }

  /**
   * Render the revealed recovery link with a copy-to-clipboard button.
   *
   * @param {object} user - User row object.
   * @param {{status: string, url: (string|null)}} recovery - Recovery link state for this user.
   * @param {{onCopyRecoveryLink: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Recovery link and copy button.
   */
  static #renderRecoveryLink(user, recovery, handlers) {
    return (
      <>
        <input
          type="text"
          className="form-control form-control-sm d-inline-block w-auto me-2"
          readOnly
          value={recovery.url}
        />
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => handlers.onCopyRecoveryLink(user.id, recovery.url)}
        >
          {recovery.status === 'copied'
            ? Translator.t('staff_users_page.copied')
            : Translator.t('staff_users_page.copy_link')}
        </button>
      </>
    );
  }
}
