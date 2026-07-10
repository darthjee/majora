import React from 'react';
import ActionsOverlay from '../../elements/ActionsOverlay.jsx';
import EditButton from '../../elements/EditButton.jsx';
import PageActions from '../../elements/PageActions.jsx';
import ConditionalComponent from '../../elements/ConditionalComponent.jsx';
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
   * @param {string|null} [game.cover_photo_path] - Optional cover photo URL.
   * @param {string} [game.description] - Game description text.
   * @param {object[]} [game.links] - External link objects with text and url.
   * @param {boolean} [game.can_edit] - Whether the current user can edit this game.
   * @param {object[]} [pcs] - PCs preview list.
   * @param {object[]} [npcs] - NPCs preview list.
   * @param {{onOpenUploadModal: Function}} [handlers] - Event handlers.
   * @returns {React.ReactElement} Game detail element.
   */
  static render(game, pcs = [], npcs = [], handlers = {}) {
    return (
      <div className="container mt-4">
        <PageActions backHref="#/games">
          <ConditionalComponent render={game.can_edit}>
            <EditButton href={`#/games/${game.game_slug}/edit`}>
              {Translator.t('character_page.edit')}
            </EditButton>
          </ConditionalComponent>
        </PageActions>
        <div className="row">
          <div className="col-md-4">
            <ActionsOverlay
              url={game.cover_photo_path}
              alt={game.name}
              canEdit={game.can_edit}
              onClick={handlers.onOpenUploadModal}
            />
          </div>
          <div className="col-md-8">
            <h1>
              {game.name}
            </h1>
            {game.description && (
              <p className="mt-3 text-pre-wrap">{game.description}</p>
            )}
            <LinkList links={game.links} />
          </div>
        </div>
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

}
