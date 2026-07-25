import React from 'react';
import Badge from '../../../../common/badges/Badge.jsx';
import ConditionalComponent from '../../../../common/misc/ConditionalComponent.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import Pagination from '../../../../common/pagination/Pagination.jsx';
import Table from '../../../../common/misc/Table.jsx';
import Translator from '../../../../../i18n/Translator.js';
import StaffUserStatusBadges from '../../../../common/list_types/StaffUserStatusBadges.js';

/**
 * Rendering helper for the staff users listing page.
 */
export default class StaffUsersHelper {
  /**
   * Render the users list with pagination and per-row recovery-link/approve/deny actions.
   *
   * @param {object[]} users - List of user objects (`id`, `name`, `email`, `display_name`, `status`).
   * @param {object} pagination - Pagination metadata.
   * @param {number} pagination.page - Current page.
   * @param {number} pagination.pages - Total pages.
   * @param {number} pagination.perPage - Items per page.
   * @param {object} recoveryLinks - Recovery link state map, keyed by user id.
   * @param {{onGenerateRecoveryLink: Function, onCopyRecoveryLink: Function, onApprove: Function,
   *   onDeny: Function}} handlers - Event handlers.
   * @param {React.ReactNode} [filters] - Filter bar element (`StaffUsersFilters`).
   * @param {object} [activeFilters] - Currently active filter query params, preserved on every
   *   pagination link.
   * @returns {React.ReactElement} Users list with pagination.
   */
  static render(users, pagination, recoveryLinks, handlers, filters = null, activeFilters = {}) {
    const columns = [
      { key: 'name', label: Translator.t('staff_users_page.name_column') },
      { key: 'email', label: Translator.t('staff_users_page.email_column') },
      { key: 'display_name', label: Translator.t('staff_users_page.display_name_column') },
      { key: 'status', label: Translator.t('staff_users_page.status_column') },
    ];
    const rows = users.map((user) => StaffUsersHelper.#buildRow(user));

    return (
      <div className="container mt-4">
        <PageActions backHref="#/" />
        <h1>{Translator.t('staff_users_page.title')}</h1>
        {filters}
        <Table
          columns={columns}
          rows={rows}
          renderActions={(row) => (
            StaffUsersHelper.#renderRowActions(row.user, recoveryLinks, handlers)
          )}
        />
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          perPage={pagination.perPage}
          basePath="#/staff/users"
          extraParams={activeFilters}
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
   * Build a display row for the table, keeping the raw user object under `user` (used by
   * `#renderRowActions`) alongside the formatted/badge-rendered display values used by the
   * table columns.
   *
   * @param {object} user - Raw user row (`id`, `name`, `email`, `display_name`, `status`).
   * @returns {object} Display row for the table.
   */
  static #buildRow(user) {
    const badge = StaffUserStatusBadges.build(user.status);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      display_name: user.display_name,
      status: <Badge variant={badge.variant} text={badge.text} />,
      user,
    };
  }

  /**
   * Render the per-row edit link, approve/deny actions, and recovery-link action.
   *
   * @param {object} user - User row object.
   * @param {object} recoveryLinks - Recovery link state map, keyed by user id.
   * @param {{onGenerateRecoveryLink: Function, onCopyRecoveryLink: Function, onApprove: Function,
   *   onDeny: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Row actions.
   */
  static #renderRowActions(user, recoveryLinks, handlers) {
    const recovery = recoveryLinks[user.id] ?? { status: 'idle', url: null };

    return (
      <>
        <a href={`#/staff/users/${user.id}/edit`} className="btn btn-secondary btn-sm me-2">
          {Translator.t('staff_users_page.edit')}
        </a>
        {StaffUsersHelper.#renderApproveAction(user, handlers)}
        <button
          type="button"
          className="btn btn-outline-danger btn-sm me-2"
          onClick={() => handlers.onDeny(user.id)}
        >
          {Translator.t('staff_users_page.deny')}
        </button>
        {StaffUsersHelper.#renderRecoveryAction(user, recovery, handlers)}
      </>
    );
  }

  /**
   * Render the Approve action for a single row, shown only while the user is still `pending`.
   *
   * @param {object} user - User row object.
   * @param {{onApprove: Function}} handlers - Event handlers.
   * @returns {React.ReactElement|null} Approve action, or null when the user isn't `pending`.
   */
  static #renderApproveAction(user, handlers) {
    if (user.status !== 'pending') {
      return null;
    }

    return (
      <button
        type="button"
        className="btn btn-success btn-sm me-2"
        onClick={() => handlers.onApprove(user.id)}
      >
        {Translator.t('staff_users_page.approve')}
      </button>
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
        <ConditionalComponent render={recovery.status === 'error'}>
          <span className="text-danger me-2">{Translator.t('staff_users_page.link_error')}</span>
        </ConditionalComponent>
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
