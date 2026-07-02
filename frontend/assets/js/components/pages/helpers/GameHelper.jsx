import React from 'react';
import CardPhoto from '../../elements/CardPhoto.jsx';
import EditButton from '../../elements/EditButton.jsx';
import PageActions from '../../elements/PageActions.jsx';
import CharacterPhotos from '../../elements/CharacterPhotos.jsx';
import CharacterPreviewSection from '../../elements/CharacterPreviewSection.jsx';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import LinkList from '../../elements/LinkList.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
import Translator from '../../../i18n/Translator.js';

/**
 * Rendering helper for the Game detail page.
 */
export default class GameHelper {
  /**
   * Render the game detail view with description, character previews, and treasures link.
   *
   * @param {object} game - Game data object.
   * @param {string} game.name - Game name.
   * @param {string} game.game_slug - Game slug used to build the treasures href.
   * @param {string|null} [game.cover_photo_path] - Optional cover photo URL, takes precedence over game.photo.
   * @param {string|null} [game.photo] - Optional cover image URL, used as a fallback.
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
        <PageActions backHref="#/games">
          {game.can_edit && (
            <EditButton href={`#/games/${game.game_slug}/edit`}>
              {Translator.t('character_page.edit')}
            </EditButton>
          )}
        </PageActions>
        <div className="row">
          <div className="col-md-4">
            <CardPhoto url={game.cover_photo_path || game.photo} alt={game.name} />
          </div>
          <div className="col-md-8">
            <h1>
              {game.name}
            </h1>
            {game.description && (
              <p className="mt-3">{game.description}</p>
            )}
            <LinkList links={game.links} />
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
        <div className="mt-3">
          <a href={`#/games/${game.game_slug}/treasures`} className="btn btn-outline-secondary">
            {Translator.t('game_page.treasures')}
          </a>
        </div>
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

}
