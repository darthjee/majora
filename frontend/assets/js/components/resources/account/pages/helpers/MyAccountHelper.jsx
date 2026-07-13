import React from 'react';
import FormField from '../../../../elements/FormField.jsx';
import ErrorAlert from '../../../../elements/ErrorAlert.jsx';
import LoadingMessage from '../../../../elements/LoadingMessage.jsx';
import SubmitButton from '../../../../elements/SubmitButton.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the my account page.
 */
export default class MyAccountHelper {
  /**
   * Render the account edit form.
   *
   * @param {{name: string, email: string, password: string, passwordConfirmation: string,
   *   status: string, fieldErrors: object}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onEmailChange: Function,
   *   onPasswordChange: Function, onPasswordConfirmationChange: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered account page.
   */
  static render(formState, handlers) {
    return (
      <div className="container mt-4">
        <h1>{Translator.t('my_account_page.title')}</h1>
        {MyAccountHelper.#renderError(formState)}
        <form onSubmit={handlers.onSubmit}>
          <FormField
            id="my-account-name"
            type="text"
            label={Translator.t('my_account_page.name_label')}
            value={formState.name}
            onChange={handlers.onNameChange}
            errors={formState.fieldErrors.name ?? []}
          />
          <FormField
            id="my-account-email"
            type="email"
            label={Translator.t('my_account_page.email_label')}
            value={formState.email}
            onChange={handlers.onEmailChange}
            errors={formState.fieldErrors.email ?? []}
          />
          <FormField
            id="my-account-password"
            type="password"
            label={Translator.t('my_account_page.password_label')}
            value={formState.password}
            onChange={handlers.onPasswordChange}
            errors={formState.fieldErrors.password ?? []}
          />
          <FormField
            id="my-account-password-confirmation"
            type="password"
            label={Translator.t('my_account_page.password_confirmation_label')}
            value={formState.passwordConfirmation}
            onChange={handlers.onPasswordConfirmationChange}
            errors={formState.fieldErrors.password_confirmation ?? []}
          />
          <SubmitButton disabled={formState.status === 'submitting'}>
            {Translator.t('my_account_page.submit')}
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
    return <LoadingMessage message={Translator.t('my_account_page.loading')} />;
  }

  static #renderError(formState) {
    if (formState.status !== 'error') {
      return null;
    }

    return <ErrorAlert error={Translator.t('my_account_page.error')} />;
  }
}
