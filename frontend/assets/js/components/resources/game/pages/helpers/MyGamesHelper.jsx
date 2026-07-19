import React from 'react';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the My Games listing page.
 */
export default class MyGamesHelper {
  /**
   * Render the my games page: header (back button) and the shared `ListPage` grid
   * (type `my-games`). Read-only: the user's games have no "New"/upload affordance here.
   *
   * @returns {React.ReactElement} Rendered my games page.
   */
  static render() {
    return (
      <>
        <div className="container mt-4">
          <PageActions backHref="#/" />
        </div>
        <ListPage
          type="my-games"
          basePath="#/games"
          loadingMessage={Translator.t('game_characters_page.loading')}
        />
      </>
    );
  }
}
