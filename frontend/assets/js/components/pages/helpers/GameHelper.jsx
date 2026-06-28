import React from 'react';
import BackButton from '../../elements/BackButton.jsx';
import CardPhoto from '../../elements/CardPhoto.jsx';
import CharacterPhotos from '../../elements/CharacterPhotos.jsx';
import CharacterPreviewSection from '../../elements/CharacterPreviewSection.jsx';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
import Translator from '../../../i18n/Translator.js';

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
   * @param {object[]} [game.photos] - Additional photo objects with id and url.
   * @param {object[]} [game.links] - External link objects with text and url.
   * @param {boolean} [game.can_edit] - Whether the current user can edit this game.
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
            <h1>
              {game.name}
              {GameHelper.#renderEditLink(game)}
            </h1>
            {game.description && (
              <p className="mt-3">{game.description}</p>
            )}
            {GameHelper.#renderLinks(game)}
          </div>
        </div>
        <CharacterPhotos photos={game.photos} alt={game.name} />
        <CharacterPreviewSection
          characters={pcs}
          gameSlug={game.game_slug}
          characterType="pc"
          title={Translator.t('game_page.player_characters')}
          seeAllHref={`#/games/${game.game_slug}/pcs`}
        />
        <CharacterPreviewSection
          characters={npcs}
          gameSlug={game.game_slug}
          characterType="npc"
          title={Translator.t('game_page.non_player_characters')}
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
    return <LoadingMessage message={Translator.t('game_page.loading')} />;
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

  static #renderEditLink(game) {
    if (!game.can_edit) {
      return null;
    }

    return (
      <a href={`#/games/${game.game_slug}/edit`} className="btn btn-secondary ms-2">
        {Translator.t('character_page.edit')}
      </a>
    );
  }

  static #renderLinks(game) {
    if (!game.links || game.links.length === 0) {
      return null;
    }

    return (
      <ul>
        {game.links.map((link) => (
          <li key={link.url}>
            <a href={link.url} target="_blank" rel="noreferrer">{link.text}</a>
          </li>
        ))}
      </ul>
    );
  }
}
