import React from 'react';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the game treasure edit page, via the `treasure` `showTypeConfig` entry
 * (issue #738).
 */
export default class GameTreasureEditHelper {
  /**
   * Render the game treasure edit form through `ShowPageLayout`.
   *
   * @param {{name: string, value: string, maxUnits: string, status: string, fieldErrors: object,
   *   isExclusive: boolean, gameType: string}} formState - Form state. `maxUnits` is the raw
   *   (string) form value; an empty string means unlimited (`null`). `isExclusive` marks a
   *   treasure exclusive to the game (via the `Treasure.game` FK) rather than linked through
   *   the shared M2M — the `max_units` field is hidden for exclusive treasures since the
   *   backend ignores it for them. `gameType` is the treasure's own (fixed-at-creation)
   *   currency model name, defaulting to `dnd`.
   * @param {{onSubmit: Function, onNameChange: Function, onOpenValueModal: Function,
   *   onMaxUnitsChange: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered edit page.
   */
  static render(formState, handlers) {
    return (
      <ShowPageLayout
        type="treasure"
        mode="edit"
        context={{ ...formState, handlers }}
      />
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('game_treasures_page.loading')} />;
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
}
