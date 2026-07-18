import React from 'react';
import Avatar from '../../../../common/Avatar.jsx';
import FormField from '../../../../common/FormField.jsx';
import ErrorAlert from '../../../../common/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/LoadingMessage.jsx';
import SubmitButton from '../../../../common/SubmitButton.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the my account page.
 */
export default class MyAccountHelper {
  /**
   * Render the account edit form.
   *
   * @param {{name: string, displayName: string, firstName: string, lastName: string,
   *   email: string, avatarUrl: string|null, password: string, passwordConfirmation: string,
   *   status: string, fieldErrors: object}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onDisplayNameChange: Function,
   *   onFirstNameChange: Function, onLastNameChange: Function, onEmailChange: Function,
   *   onPasswordChange: Function, onPasswordConfirmationChange: Function}} handlers - Event
   *   handlers.
   * @returns {React.ReactElement} Rendered account page.
   */
  static render(formState, handlers) {
    return (
      <div className="container mt-4">
        <Avatar url={formState.avatarUrl} alt={Translator.t('my_account_page.avatar_alt')} />
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
            id="my-account-display-name"
            type="text"
            label={Translator.t('my_account_page.display_name_label')}
            value={formState.displayName}
            onChange={handlers.onDisplayNameChange}
            errors={formState.fieldErrors.display_name ?? []}
          />
          <FormField
            id="my-account-first-name"
            type="text"
            label={Translator.t('my_account_page.first_name_label')}
            value={formState.firstName}
            onChange={handlers.onFirstNameChange}
            errors={formState.fieldErrors.first_name ?? []}
          />
          <FormField
            id="my-account-last-name"
            type="text"
            label={Translator.t('my_account_page.last_name_label')}
            value={formState.lastName}
            onChange={handlers.onLastNameChange}
            errors={formState.fieldErrors.last_name ?? []}
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
