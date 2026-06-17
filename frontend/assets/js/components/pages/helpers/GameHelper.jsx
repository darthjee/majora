import React from 'react';
import BackButton from '../../elements/BackButton.jsx';
import CardPhoto from '../../elements/CardPhoto.jsx';
import CharacterPreviewSection from '../../elements/CharacterPreviewSection.jsx';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';

/**
 * Rendering helper for the Game detail page.
 */
export default class GameHelper {
  /**
   * Render the game detail view with description and character previews.
   *
   * @param {object} game - Game data object.
   * @param {string} game.name - Game name.
   * @param {string} game.game_slug - Game slug.
   * @param {string|null} [game.photo] - Optional cover image URL.
   * @param {string} [game.description] - Game description text.
   * @param {object[]} [pcs] - PCs preview list.
   * @param {object[]} [npcs] - NPCs preview list.
   * @returns {React.ReactElement} Game detail element.
   */
  static render(game, pcs = [], npcs = []) {
    return (
      <div className="container mt-4">
        <BackButton href="#/games" />
        <div className="row">
          <div className="col-md-4">
            <CardPhoto url={game.photo} alt={game.name} />
          </div>
          <div className="col-md-8">
            <h1>{game.name}</h1>
            {game.description && (
              <p className="mt-3">{game.description}</p>
            )}
          </div>
        </div>
        <CharacterPreviewSection
          characters={pcs}
          gameSlug={game.game_slug}
          characterType="pc"
          title="Player Characters"
          seeAllHref={`#/games/${game.game_slug}/pcs`}
        />
        <CharacterPreviewSection
          characters={npcs}
          gameSlug={game.game_slug}
          characterType="npc"
          title="Non-Player Characters"
          seeAllHref={`#/games/${game.game_slug}/npcs`}
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
    return <LoadingMessage message="Loading game..." />;
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
