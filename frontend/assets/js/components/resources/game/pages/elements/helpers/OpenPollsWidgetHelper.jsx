import React from 'react';
import Placeholder from 'react-bootstrap/cjs/Placeholder.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the OpenPollsWidget element.
 */
export default class OpenPollsWidgetHelper {
  /**
   * Render the open-polls widget: a title, the loading placeholder or the
   * resolved count, and a link to the game polls list.
   *
   * @param {{count: number, loading: boolean, gameSlug: string}} state - Widget state.
   * @returns {React.ReactElement} Rendered widget.
   */
  static render(state) {
    return (
      <div className="mt-4" data-testid="open-polls-widget">
        <h2>{Translator.t('game_page.polls_title')}</h2>
        <p>{OpenPollsWidgetHelper.#renderCount(state)}</p>
        <a href={`#/games/${state.gameSlug}/polls`} className="btn btn-secondary mb-3">
          {Translator.t('game_page.view_polls')}
        </a>
      </div>
    );
  }

  static #renderCount(state) {
    if (state.loading) {
      return <Placeholder as="span" animation="glow" xs={2} data-testid="open-polls-loading" />;
    }

    return Translator.t('game_page.open_polls_count').replace('{{count}}', state.count);
  }
}
