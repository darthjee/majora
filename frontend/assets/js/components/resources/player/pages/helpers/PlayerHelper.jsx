import React from 'react';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import Pagination from '../../../../common/pagination/Pagination.jsx';
import PlayerProfileCard from '../elements/PlayerProfileCard.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Player detail page (issue #695).
 */
export default class PlayerHelper {
  /**
   * Render the player detail view: two compact cards (the player's character and their linked
   * user account), a left column with the paginated conversations shared with the current user,
   * and an inert right-hand column reserved for a future messages feature.
   *
   * @param {object} player - Player data object, same shape as `PlayerListSerializer`.
   * @param {object|null} [player.character] - Player's character (`name`, `photo_url`), or
   *   `null` when the player owns no PC (e.g. the DM).
   * @param {object|null} [player.user] - Linked user account (`display_name`, `photo_url`), or
   *   `null` when the player has no linked account.
   * @param {string} backHref - Hash path to the players roster page.
   * @param {object} conversationsState - Conversations column state.
   * @param {string} conversationsState.basePath - Base hash path for conversations pagination links.
   * @param {string} conversationsState.pageParam - Query param name used for the conversations page.
   * @param {object[]} conversationsState.conversations - Loaded conversation entries (`id`, `title`).
   * @param {object} conversationsState.pagination - Conversations pagination metadata
   *   (`page`, `pages`, `perPage`).
   * @param {boolean} conversationsState.loading - Whether conversations are still loading.
   * @param {string} conversationsState.error - Conversations load error message, if any.
   * @returns {React.ReactElement} Player detail element.
   */
  static render(player, backHref, conversationsState) {
    return (
      <div className="container mt-4">
        <PageActions backHref={backHref} />
        <div className="row mb-4">
          <PlayerProfileCard
            label={Translator.t('player_page.character_label')}
            photoUrl={player.character?.photo_url}
            name={player.character?.name || Translator.t('player_page.no_character')}
          />
          <PlayerProfileCard
            label={Translator.t('player_page.player_label')}
            photoUrl={player.user?.photo_url}
            name={player.user?.display_name || Translator.t('player_page.no_user')}
          />
        </div>
        <div className="row">
          <div className="col-md-6">
            {PlayerHelper.#renderConversations(conversationsState)}
          </div>
          <div className="col-md-6">
            {/* Reserved for a future messages feature (issue #695) — intentionally empty. */}
          </div>
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
    return <LoadingMessage message={Translator.t('player_page.loading')} />;
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

  static #renderConversations({
    basePath, pageParam, conversations, pagination, loading, error,
  }) {
    if (loading) {
      return <LoadingMessage message={Translator.t('player_page.conversations_loading')} />;
    }

    if (error) {
      return <ErrorAlert error={error} />;
    }

    return (
      <>
        <h5>{Translator.t('player_page.conversations_title')}</h5>
        {PlayerHelper.#renderConversationsList(conversations)}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          perPage={pagination.perPage}
          basePath={basePath}
          pageParam={pageParam}
        />
      </>
    );
  }

  static #renderConversationsList(conversations) {
    if (conversations.length === 0) {
      return <p className="text-muted">{Translator.t('player_page.conversations_empty')}</p>;
    }

    return (
      <ul className="list-group mb-3">
        {conversations.map((conversation) => (
          <li key={conversation.id} className="list-group-item">{conversation.title}</li>
        ))}
      </ul>
    );
  }
}
