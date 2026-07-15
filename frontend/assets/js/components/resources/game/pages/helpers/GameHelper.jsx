import React from 'react';
import ActionsOverlay from '../../../../common/ActionsOverlay.jsx';
import EditButton from '../../../../common/EditButton.jsx';
import PageActions from '../../../../common/PageActions.jsx';
import ConditionalComponent from '../../../../common/ConditionalComponent.jsx';
import CharacterPreviewSection from '../../../../common/CharacterPreviewSection.jsx';
import ErrorAlert from '../../../../common/ErrorAlert.jsx';
import LinkList from '../../../../common/LinkList.jsx';
import LoadingMessage from '../../../../common/LoadingMessage.jsx';
import OpenPollsWidget from '../elements/OpenPollsWidget.jsx';
import Translator from '../../../../../i18n/Translator.js';

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
   * @param {{title: string, date: (string|null)}|null} [game.next_session] - Upcoming session
   *   summary, or `null` when the game has no sessions at all.
   * @param {boolean} [game.is_dm] - Whether the current user is a DM of the game, gating the
   *   open-polls widget.
   * @param {boolean} [game.is_player] - Whether the current user is a player of the game,
   *   gating the open-polls widget.
   * @param {boolean} [game.is_superuser] - Whether the current user is a superuser, gating the
   *   open-polls widget.
   * @param {boolean} [game.is_staff] - Whether the current user is staff, gating the open-polls
   *   widget.
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
        {GameHelper.#renderNextSession(game)}
        <OpenPollsWidget game={game} />
      </div>
    );
  }

  static #renderNextSession(game) {
    return (
      <div className="mt-4">
        <h2>{Translator.t('game_page.next_session_title')}</h2>
        {GameHelper.#renderNextSessionSummary(game.next_session)}
        <a href={`#/games/${game.game_slug}/sessions`} className="btn btn-secondary mb-3">
          {Translator.t('game_page.sessions')}
        </a>
      </div>
    );
  }

  static #renderNextSessionSummary(nextSession) {
    if (!nextSession) {
      return <p className="text-muted">{Translator.t('game_page.no_next_session')}</p>;
    }

    return (
      <p>
        {nextSession.title}
        {' — '}
        {nextSession.date ?? Translator.t('game_session_page.no_date')}
      </p>
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
