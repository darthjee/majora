import React from 'react';
import FormField from '../../../../common/FormField.jsx';
import ErrorAlert from '../../../../common/ErrorAlert.jsx';
import SubmitButton from '../../../../common/SubmitButton.jsx';
import Translator from '../../../../../i18n/Translator.js';
import StaffUserHelper from './StaffUserHelper.jsx';

/**
 * Rendering helper for the staff user edit page.
 */
export default class StaffUserEditHelper {
  /**
   * Render the user edit form.
   *
   * @param {{name: string, email: string, status: string, fieldErrors: object}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onEmailChange: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered edit page.
   */
  static render(formState, handlers) {
    return (
      <div className="container mt-4">
        <h1>{Translator.t('staff_user_edit_page.title')}</h1>
        {StaffUserEditHelper.#renderError(formState)}
        <form onSubmit={handlers.onSubmit}>
          <FormField
            id="staff-user-edit-name"
            type="text"
            label={Translator.t('staff_user_edit_page.name_label')}
            value={formState.name}
            onChange={handlers.onNameChange}
            errors={formState.fieldErrors.name ?? []}
          />
          <FormField
            id="staff-user-edit-email"
            type="email"
            label={Translator.t('staff_user_edit_page.email_label')}
            value={formState.email}
            onChange={handlers.onEmailChange}
            errors={formState.fieldErrors.email ?? []}
          />
          <SubmitButton disabled={formState.status === 'submitting'}>
            {Translator.t('staff_user_edit_page.submit')}
          </SubmitButton>
        </form>
      </div>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return StaffUserHelper.renderLoading();
  }

  static #renderError(formState) {
    if (formState.status !== 'error') {
      return null;
    }

    return <ErrorAlert error={Translator.t('staff_user_edit_page.error')} />;
  }
}
