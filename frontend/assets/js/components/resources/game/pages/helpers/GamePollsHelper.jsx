import React from 'react';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import NewButton from '../../../../common/buttons/NewButton.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import Pagination from '../../../../common/pagination/Pagination.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Game Polls listing page.
 */
export default class GamePollsHelper {
  /**
   * Render the polls list, status filter bar, "New Poll" button, and pagination.
   *
   * @param {object} state - Page state.
   * @param {object[]} state.polls - List of poll objects (`id`, `title`, `status`).
   * @param {object} state.pagination - Pagination metadata (`page`, `pages`, `perPage`).
   * @param {string} state.gameSlug - Game slug used to build each poll's detail link.
   * @param {string} state.basePath - Base hash path used for pagination links.
   * @param {string} state.backHref - Hash path to the parent game page.
   * @param {string} state.newHref - Hash path to the new poll form.
   * @param {object} [state.activeFilters] - Currently active filter query params, preserved
   *   on every pagination link.
   * @param {React.ReactNode} [state.filters] - Filter bar element (`PollFilters`).
   * @returns {React.ReactElement} Rendered polls page.
   */
  static render(state) {
    const {
      polls, pagination, gameSlug, basePath, backHref, newHref, activeFilters = {}, filters = null,
    } = state;

    return (
      <div className="container mt-4">
        <PageActions backHref={backHref}>
          <NewButton href={newHref}>
            {Translator.t('game_polls_page.new_poll')}
          </NewButton>
        </PageActions>
        <h1 className="mb-4">{Translator.t('game_polls_page.title')}</h1>
        {filters}
        {GamePollsHelper.#renderList(polls, gameSlug)}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          perPage={pagination.perPage}
          basePath={basePath}
          extraParams={activeFilters}
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
    return <LoadingMessage message={Translator.t('game_polls_page.loading')} />;
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

  static #renderList(polls, gameSlug) {
    if (polls.length === 0) {
      return <p className="text-muted">{Translator.t('game_polls_page.empty')}</p>;
    }

    return (
      <ul className="list-group mb-4">
        {polls.map((poll) => GamePollsHelper.#renderPollItem(poll, gameSlug))}
      </ul>
    );
  }

  static #renderPollItem(poll, gameSlug) {
    return (
      <li key={poll.id} className="list-group-item d-flex justify-content-between align-items-center">
        <a href={`#/games/${gameSlug}/polls/${poll.id}`}>
          {poll.title}
        </a>
        <span className="text-muted">
          {Translator.t(`game_polls_page.status_${poll.status}`)}
        </span>
      </li>
    );
  }
}
