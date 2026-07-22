import React from 'react';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';

/**
 * Rendering helper for the game treasure creation page, via the `treasure` `showTypeConfig`
 * entry (issue #738).
 */
export default class GameTreasureNewHelper {
  /**
   * Render the game treasure creation form through `ShowPageLayout`.
   *
   * @param {{name: string, value: string, gameType: string, status: string,
   *   fieldErrors: object}} formState - Form state. `gameType` is the containing game's
   *   currency model name, defaulting to `dnd`; there is no picker here, since the type
   *   is forced to the game's own type.
   * @param {{onSubmit: Function, onNameChange: Function, onOpenValueModal: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered new treasure page.
   */
  static render(formState, handlers) {
    return (
      <ShowPageLayout
        type="treasure"
        mode="new"
        context={{ ...formState, handlers }}
      />
    );
  }
}
