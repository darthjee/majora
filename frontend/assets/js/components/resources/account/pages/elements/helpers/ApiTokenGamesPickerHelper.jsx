import React from 'react';
import MultiResourcePickerField from '../../../../../common/forms/MultiResourcePickerField.jsx';
import FieldErrors from '../../../../../common/forms/FieldErrors.jsx';
import { MAX_GAMES } from '../ApiTokenGamesSelection.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Number of matching games listed under the search input at once. The search filters the whole
 * list before this cap applies, so every game stays reachable by typing.
 *
 * @type {number}
 */
const VISIBLE_RESULTS = 10;

/**
 * Renders the API token games picker (issue #1605).
 */
export default class ApiTokenGamesPickerHelper {
  /**
   * Render the picker (or the no-games note), the selection notes and the field errors.
   *
   * @param {{value: Array<{slug: string, name: string}>, games: Array<{slug: string,
   *   name: string}>, allGames: boolean, errors: Array<string>}} state - Selected games, the
   *   reachable games, the `all_games` flag and the `games` field errors.
   * @param {{onChange: Function}} handlers - Picker change handler (`{id, name}` selection).
   * @returns {React.ReactElement} Rendered games picker.
   */
  static render(state, handlers) {
    return (
      <div className="mb-3" data-testid="api-token-games-picker">
        {ApiTokenGamesPickerHelper.#renderPicker(state, handlers)}
        {ApiTokenGamesPickerHelper.#renderLimit(state)}
        {ApiTokenGamesPickerHelper.#renderEmptyNote(state)}
        {ApiTokenGamesPickerHelper.#renderSuperuserWarning(state)}
        <FieldErrors errors={state.errors} />
      </div>
    );
  }

  /**
   * Render the searchable multi-select, or the no-games note when nothing is reachable.
   *
   * @param {{value: Array<object>, games: Array<object>}} state - Picker state.
   * @param {{onChange: Function}} handlers - Picker change handler.
   * @returns {React.ReactElement} Picker or no-games note.
   */
  static #renderPicker(state, handlers) {
    if (state.games.length === 0) {
      return (
        <>
          <span className="form-label d-block">{Translator.t('api_tokens_page.games_label')}</span>
          <p className="form-text" data-testid="api-token-games-none">
            {Translator.t('api_tokens_page.games_none_reachable')}
          </p>
        </>
      );
    }

    const names = Object.fromEntries(state.games.map(({ slug, name }) => [slug, name]));
    const selected = new Set(state.value.map(({ slug }) => slug));
    const capped = state.value.length >= MAX_GAMES;
    const values = capped ? [] : state.games.map(({ slug }) => slug).filter((slug) => !selected.has(slug));

    return (
      <MultiResourcePickerField
        picker={{ values, translateOption: (slug) => names[slug], maxEntries: VISIBLE_RESULTS }}
        value={state.value.map(({ slug, name }) => ({ id: slug, name }))}
        onChange={handlers.onChange}
        label={Translator.t('api_tokens_page.games_label')}
        searchPlaceholder={Translator.t('api_tokens_page.games_search')}
        removeLabel={Translator.t('api_tokens_page.games_remove')}
      />
    );
  }

  /**
   * Render the cap hint once `MAX_GAMES` games are selected.
   *
   * @param {{value: Array<object>}} state - Picker state.
   * @returns {React.ReactElement|null} Cap hint, or `null` below the cap.
   */
  static #renderLimit(state) {
    if (state.value.length < MAX_GAMES) return null;

    return (
      <p className="form-text" data-testid="api-token-games-limit">
        {Translator.t('api_tokens_page.games_limit').replace('{{max}}', MAX_GAMES)}
      </p>
    );
  }

  /**
   * Render the "every reachable game" note when no game is selected.
   *
   * @param {{value: Array<object>, games: Array<object>}} state - Picker state.
   * @returns {React.ReactElement|null} Empty-selection note, or `null`.
   */
  static #renderEmptyNote(state) {
    if (state.value.length > 0 || state.games.length === 0) return null;

    return (
      <p className="form-text" data-testid="api-token-games-empty-note">
        {Translator.t('api_tokens_page.games_empty_note').replace('{{count}}', state.games.length)}
      </p>
    );
  }

  /**
   * Render the superuser warning when `all_games` is true and no game is selected.
   *
   * @param {{value: Array<object>, allGames: boolean}} state - Picker state.
   * @returns {React.ReactElement|null} Warning alert, or `null`.
   */
  static #renderSuperuserWarning(state) {
    if (!state.allGames || state.value.length > 0) return null;

    return (
      <div className="alert alert-warning" data-testid="api-token-games-superuser-warning">
        {Translator.t('api_tokens_page.games_superuser_warning')}
      </div>
    );
  }
}
