import EditButton from '../../../../common/buttons/EditButton.jsx';
import ConditionalComponent from '../../../../common/misc/ConditionalComponent.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Game detail page.
 */
export default class GameHelper {
  /**
   * Render the game detail view with description and character previews.
   *
   * @param {object} game - Game data object.
   * @param {string} game.name - Game name.
   * @param {string} game.game_slug - Game slug used to build section hrefs (sessions, PCs, NPCs).
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
      <ShowPageLayout
        type="game"
        mode="show"
        backHref="#/games"
        pageActions={(
          <ConditionalComponent render={game.can_edit}>
            <EditButton href={`#/games/${game.game_slug}/edit`}>
              {Translator.t('character_page.edit')}
            </EditButton>
          </ConditionalComponent>
        )}
        context={{ ...game, pcs, npcs, handlers }}
      />
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
