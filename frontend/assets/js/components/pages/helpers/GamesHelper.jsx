import React from 'react';
import BackButton from '../../elements/BackButton.jsx';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import GameCard from '../../elements/GameCard.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
import Pagination from '../../elements/Pagination.jsx';
import Translator from '../../../i18n/Translator.js';

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
   * @returns {React.ReactElement} Games grid with pagination.
   */
  static render(games, pagination) {
    return (
      <div className="container mt-4">
        <BackButton href="#/" />
        <a href="#/games/new" className="btn btn-primary mb-3">
          {Translator.t('games_page.new_game')}
        </a>
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
