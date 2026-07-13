import React from 'react';
import ErrorAlert from '../../../../common/ErrorAlert.jsx';
import GameCard from '../elements/GameCard.jsx';
import LoadingMessage from '../../../../common/LoadingMessage.jsx';
import NewButton from '../../../../common/NewButton.jsx';
import PageActions from '../../../../common/PageActions.jsx';
import Pagination from '../../../../common/Pagination.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Games listing page.
 */
export default class GamesHelper {
  /**
   * Render the games grid with pagination.
   *
   * @param {object[]} games - List of game objects.
   * @param {object} pagination - Pagination metadata.
   * @param {number} pagination.page - Current page.
   * @param {number} pagination.pages - Total pages.
   * @param {number} pagination.perPage - Items per page.
   * @param {boolean} loggedIn - Whether the user is currently logged in.
   * @returns {React.ReactElement} Games grid with pagination.
   */
  static render(games, pagination, loggedIn) {
    return (
      <div className="container mt-4">
        <PageActions backHref="#/">
          {loggedIn && (
            <NewButton href="#/games/new">
              {Translator.t('games_page.new_game')}
            </NewButton>
          )}
        </PageActions>
        <div className="row">
          {games.map((game) => (
            <GameCard key={game.game_slug} game={game} />
          ))}
        </div>
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          perPage={pagination.perPage}
          basePath="#/games"
        />
      </div>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('games_page.loading')} />;
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
