import FieldErrors from '../../../../../common/forms/FieldErrors.jsx';
import ApiTokenExpiry from '../ApiTokenExpiry.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Renders the API token expiry field (issue #1605).
 */
export default class ApiTokenExpiryFieldHelper {
  /**
   * Render the expiry radios, the custom date input or the "Never" hint, and the field errors.
   *
   * @param {{value: {choice: string, customDate: string}, minDate: string,
   *   errors: Array<string>}} state - Expiry state, the earliest custom date and the
   *   `expires_at` field errors.
   * @param {{onChoiceChange: Function, onDateChange: Function}} handlers - Change handlers.
   * @returns {React.ReactElement} Rendered expiry field.
   */
  static render(state, handlers) {
    return (
      <div className="mb-3" data-testid="api-token-expiry">
        <span className="form-label d-block">{Translator.t('api_tokens_page.expiry_label')}</span>
        {ApiTokenExpiry.CHOICES.map((choice) => (
          <div className="form-check form-check-inline" key={choice}>
            <input
              id={`api-token-expiry-${choice}`}
              type="radio"
              className="form-check-input"
              name="api-token-expiry"
              value={choice}
              checked={state.value.choice === choice}
              onChange={() => handlers.onChoiceChange(choice)}
            />
            <label className="form-check-label" htmlFor={`api-token-expiry-${choice}`}>
              {Translator.t(`api_tokens_page.expiry_${choice}`)}
            </label>
          </div>
        ))}
        {ApiTokenExpiryFieldHelper.#renderCustomDate(state, handlers)}
        {ApiTokenExpiryFieldHelper.#renderNeverHint(state)}
        <FieldErrors errors={state.errors} />
      </div>
    );
  }

  /**
   * Render the custom date input when the custom choice is selected.
   *
   * @param {{value: {choice: string, customDate: string}, minDate: string}} state - Expiry state.
   * @param {{onDateChange: Function}} handlers - Date change handler.
   * @returns {React.ReactElement|null} Date input, or `null`.
   */
  static #renderCustomDate(state, handlers) {
    if (state.value.choice !== 'custom') return null;

    return (
      <input
        type="date"
        className="form-control mt-2"
        data-testid="api-token-expiry-date"
        aria-label={Translator.t('api_tokens_page.expiry_custom')}
        min={state.minDate}
        value={state.value.customDate}
        onChange={(event) => handlers.onDateChange(event.target.value)}
      />
    );
  }

  /**
   * Render the soft "Never" hint when the never choice is selected.
   *
   * @param {{value: {choice: string}}} state - Expiry state.
   * @returns {React.ReactElement|null} Hint, or `null`.
   */
  static #renderNeverHint(state) {
    if (state.value.choice !== 'never') return null;

    return (
      <p className="form-text text-warning" data-testid="api-token-expiry-never-hint">
        {Translator.t('api_tokens_page.expiry_never_hint')}
      </p>
    );
  }
}
