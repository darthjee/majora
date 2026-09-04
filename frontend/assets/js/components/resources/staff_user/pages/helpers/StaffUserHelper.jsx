import React from 'react';
import BackButton from '../../../../common/buttons/BackButton.jsx';
import Badge from '../../../../common/badges/Badge.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import Translator from '../../../../../i18n/Translator.js';
import StaffUserStatusBadges from '../../../../common/list_types/StaffUserStatusBadges.js';

/**
 * Rendering helper for the staff user detail page.
 */
export default class StaffUserHelper {
  /**
   * Render the user detail view, composed of the details block, the recovery-token panel slot,
   * and the edit action.
   *
   * @param {object} user - User data object.
   * @param {number} user.id - User id.
   * @param {string} user.name - User name.
   * @param {string} user.email - User email.
   * @param {string} user.status - User status (`'pending'`, `'approved'`, or `'denied'`).
   * @returns {React.ReactElement} User detail element.
   */
  static render(user) {
    return (
      <div className="container mt-4">
        <BackButton href="#/staff/users" />
        <h1>{Translator.t('staff_user_page.title')}</h1>
        {StaffUserHelper.#renderDetails(user)}
        {StaffUserHelper.#renderRecoveryTokenPanel()}
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
   * Render the recovery-token panel slot. Placeholder for the follow-up sub-issue; renders
   * nothing for now.
   *
   * @returns {null} Nothing, until the recovery-token panel is implemented.
   */
  static #renderRecoveryTokenPanel() {
    return null;
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
