import React from 'react';
import CharacterCard from '../../elements/CharacterCard.jsx';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
import Pagination from '../../elements/Pagination.jsx';

/**
 * Rendering helper shared by the GamePcs and GameNpcs pages.
 */
export default class GameCharactersHelper {
  /**
   * Render a character grid with pagination.
   *
   * @param {object[]} characters - List of character objects.
   * @param {object} pagination - Pagination metadata.
   * @param {number} pagination.page - Current page.
   * @param {number} pagination.pages - Total pages.
   * @param {number} pagination.perPage - Items per page.
   * @param {string} basePath - Base hash path used for pagination links (e.g. "#/games/slug/pcs").
   * @param {string} gameSlug - Game slug passed to each CharacterCard for its detail link.
   * @param {string} title - Page heading (e.g. "Player Characters").
   * @returns {React.ReactElement} Characters grid with pagination.
   */
  static render(characters, pagination, basePath, gameSlug, title) {
    return (
      <div className="container mt-4">
        <h1 className="mb-4">{title}</h1>
        <div className="row">
          {characters.map((character) => (
            <CharacterCard key={character.id} character={character} gameSlug={gameSlug} />
          ))}
        </div>
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          perPage={pagination.perPage}
          basePath={basePath}
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
    return <LoadingMessage message="Loading..." />;
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
