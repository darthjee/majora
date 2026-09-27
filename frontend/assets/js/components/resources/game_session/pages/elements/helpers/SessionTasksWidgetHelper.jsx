import React from 'react';
import GameTasksController from '../../../../game/pages/controllers/GameTasksController.js';
import TaskListItem from '../../../../game/pages/elements/TaskListItem.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the SessionTasksWidget element.
 */
export default class SessionTasksWidgetHelper {
  /**
   * Render the session tasks widget: a title, then the loading message, the
   * error, the empty message or the tasks checklist, plus a "See all" link to
   * the game Tasks page filtered by the session when there are more tasks than listed.
   *
   * @param {object} state - Widget state.
   * @param {object[]} state.tasks - Listed tasks.
   * @param {number} state.total - Total number of the session's tasks.
   * @param {boolean} state.loading - Whether the tasks are still loading.
   * @param {string} state.error - Error message, or an empty string.
   * @param {string} state.gameSlug - Slug of the session's game.
   * @param {number} state.sessionId - Id of the session.
   * @param {object} handlers - Event handlers.
   * @param {Function} handlers.onToggle - Called with a task when its checkbox changes.
   * @param {Function} handlers.onView - Called with a task when its View button is clicked.
   * @returns {React.ReactElement} Rendered widget.
   */
  static render(state, handlers) {
    return (
      <section className="mt-4" data-testid="session-tasks">
        <h2>{Translator.t('game_session_page.tasks_title')}</h2>
        {SessionTasksWidgetHelper.#renderContent(state, handlers)}
        {SessionTasksWidgetHelper.#renderSeeAll(state)}
      </section>
    );
  }

  static #renderContent(state, handlers) {
    if (state.loading) {
      return <p className="text-muted">{Translator.t('game_session_page.tasks_loading')}</p>;
    }

    if (state.error) {
      return <div className="alert alert-danger" role="alert">{state.error}</div>;
    }

    if (state.tasks.length === 0) {
      return <p className="text-muted">{Translator.t('game_session_page.tasks_empty')}</p>;
    }

    return (
      <ul className="list-group mb-3">
        {state.tasks.map((task) => (
          <TaskListItem
            key={task.id}
            task={task}
            onToggle={handlers.onToggle}
            onView={handlers.onView}
            showSession={false}
            idPrefix="session-task"
          />
        ))}
      </ul>
    );
  }

  static #renderSeeAll(state) {
    if (state.loading || state.error || state.total <= state.tasks.length) {
      return null;
    }

    const href = GameTasksController.buildFilterQueryHash(
      `#/games/${state.gameSlug}/tasks`, { session: String(state.sessionId) },
    );

    return (
      <a href={href} className="btn btn-sm btn-outline-secondary">
        {Translator.t('game_session_page.tasks_see_all').replace('{{count}}', state.total)}
      </a>
    );
  }
}
