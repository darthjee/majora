import FormField from '../../../../common/FormField.jsx';
import TextareaField from '../../../../common/TextareaField.jsx';
import ErrorAlert from '../../../../common/ErrorAlert.jsx';
import SubmitButton from '../../../../common/SubmitButton.jsx';
import Translator from '../../../../../i18n/Translator.js';
import GameHelper from './GameHelper.jsx';

/**
 * Rendering helper for the game creation page.
 */
export default class GameNewHelper {
  /**
   * Render the game creation form.
   *
   * @param {{name: string, description: string, gameType: string,
   *   status: string, fieldErrors: object}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function,
   *   onDescriptionChange: Function, onGameTypeChange: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered new game page.
   */
  static render(formState, handlers) {
    return (
      <div className="container mt-4">
        <h1>{Translator.t('game_new_page.title')}</h1>
        {GameNewHelper.#renderError(formState)}
        <form onSubmit={handlers.onSubmit}>
          <FormField
            id="game-new-name"
            type="text"
            label={Translator.t('game_new_page.name_label')}
            value={formState.name}
            onChange={handlers.onNameChange}
            errors={formState.fieldErrors.name ?? []}
          />
          <TextareaField
            id="game-new-description"
            label={Translator.t('game_new_page.description_label')}
            value={formState.description}
            onChange={handlers.onDescriptionChange}
            errors={formState.fieldErrors.description ?? []}
          />
          <div className="mb-3">
            <label htmlFor="game-new-type" className="form-label">
              {Translator.t('game_new_page.game_type_label')}
            </label>
            <select
              id="game-new-type"
              className="form-select"
              value={formState.gameType}
              onChange={handlers.onGameTypeChange}
            >
              <option value="dnd">D&amp;D</option>
              <option value="deadlands">Deadlands</option>
            </select>
          </div>
          <SubmitButton disabled={formState.status === 'submitting'}>
            {Translator.t('game_new_page.submit')}
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
    return GameHelper.renderLoading();
  }

  static #renderError(formState) {
    if (formState.status !== 'error') {
      return null;
    }

    return <ErrorAlert error={Translator.t('game_new_page.error')} />;
  }
}
