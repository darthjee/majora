import React from 'react';
import Avatar from '../../../../common/misc/Avatar.jsx';
import FormField from '../../../../common/forms/FormField.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import SubmitButton from '../../../../common/buttons/SubmitButton.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Flat, declarative registry of the account form's fields, one entry per field, in the
 * current visual order. Each entry declares the `<FormField>` props that differ per
 * field: its `id`/`type`, its label's translation key, the `formState` value key to read
 * from, the `handlers` key to wire as `onChange`, and the `formState.fieldErrors` key to
 * read errors from. Exported (even though nothing outside this module needs it) so specs
 * can assert `id` uniqueness directly.
 */
export const FIELD_REGISTRY = [
  {
    id: 'my-account-name', type: 'text', labelKey: 'my_account_page.name_label', valueKey: 'name', onChangeKey: 'onNameChange', errorKey: 'name',
  },
  {
    id: 'my-account-display-name', type: 'text', labelKey: 'my_account_page.display_name_label', valueKey: 'displayName', onChangeKey: 'onDisplayNameChange', errorKey: 'display_name',
  },
  {
    id: 'my-account-first-name', type: 'text', labelKey: 'my_account_page.first_name_label', valueKey: 'firstName', onChangeKey: 'onFirstNameChange', errorKey: 'first_name',
  },
  {
    id: 'my-account-last-name', type: 'text', labelKey: 'my_account_page.last_name_label', valueKey: 'lastName', onChangeKey: 'onLastNameChange', errorKey: 'last_name',
  },
  {
    id: 'my-account-email', type: 'email', labelKey: 'my_account_page.email_label', valueKey: 'email', onChangeKey: 'onEmailChange', errorKey: 'email',
  },
  {
    id: 'my-account-password', type: 'password', labelKey: 'my_account_page.password_label', valueKey: 'password', onChangeKey: 'onPasswordChange', errorKey: 'password',
  },
  {
    id: 'my-account-password-confirmation', type: 'password', labelKey: 'my_account_page.password_confirmation_label', valueKey: 'passwordConfirmation', onChangeKey: 'onPasswordConfirmationChange', errorKey: 'password_confirmation',
  },
];

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
          {FIELD_REGISTRY.map((entry) => (
            <FormField
              key={entry.id}
              id={entry.id}
              type={entry.type}
              label={Translator.t(entry.labelKey)}
              value={formState[entry.valueKey]}
              onChange={handlers[entry.onChangeKey]}
              errors={formState.fieldErrors[entry.errorKey] ?? []}
            />
          ))}
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
