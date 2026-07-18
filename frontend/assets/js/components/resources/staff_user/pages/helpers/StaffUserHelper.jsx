import React from 'react';
import BackButton from '../../../../common/buttons/BackButton.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the staff user detail page.
 */
export default class StaffUserHelper {
  /**
   * Render the user detail view.
   *
   * @param {object} user - User data object.
   * @param {number} user.id - User id.
   * @param {string} user.name - User name.
   * @param {string} user.email - User email.
   * @returns {React.ReactElement} User detail element.
   */
  static render(user) {
    return (
      <div className="container mt-4">
        <BackButton href="#/staff/users" />
        <h1>{Translator.t('staff_user_page.title')}</h1>
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
        <a href={`#/staff/users/${user.id}/edit`} className="btn btn-secondary">
          {Translator.t('staff_user_page.edit')}
        </a>
      </div>
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
