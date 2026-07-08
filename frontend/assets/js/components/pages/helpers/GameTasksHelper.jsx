import React from 'react';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import FormField from '../../elements/FormField.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
import PageActions from '../../elements/PageActions.jsx';
import Pagination from '../../elements/Pagination.jsx';
import SubmitButton from '../../elements/SubmitButton.jsx';
import TextareaField from '../../elements/TextareaField.jsx';
import Translator from '../../../i18n/Translator.js';

/**
 * Rendering helper for the Game Tasks listing page.
 */
export default class GameTasksHelper {
  /**
   * Render the tasks checklist, inline add form, and pagination. The
   * per-task view/edit modal is rendered by the page component itself.
   *
   * @param {object} state - Page state.
   * @param {object[]} state.tasks - List of task objects.
   * @param {object} state.pagination - Pagination metadata (`page`, `pages`, `perPage`).
   * @param {string} state.basePath - Base hash path used for pagination links.
   * @param {string} state.backHref - Hash path to the parent game page.
   * @param {{shortDescription: string, longDescription: string}} state.formValues - Add-form values.
   * @param {object} state.fieldErrors - Per-field validation errors from the add form.
   * @param {object} handlers - Page event handlers (`onToggle`, `onFormChange`, `onCreate`, `onView`).
   * @returns {React.ReactElement} Rendered tasks page.
   */
  static render(state, handlers) {
    const {
      tasks, pagination, basePath, backHref, formValues, fieldErrors,
    } = state;

    return (
      <div className="container mt-4">
        <PageActions backHref={backHref} />
        <h1 className="mb-4">{Translator.t('game_tasks_page.title')}</h1>
        {GameTasksHelper.#renderList(tasks, handlers)}
        {GameTasksHelper.#renderAddForm(formValues, fieldErrors, handlers)}
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
    return <LoadingMessage message={Translator.t('game_tasks_page.loading')} />;
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

  static #renderList(tasks, handlers) {
    if (tasks.length === 0) {
      return <p className="text-muted">{Translator.t('game_tasks_page.empty')}</p>;
    }

    return (
      <ul className="list-group mb-4">
        {tasks.map((task) => GameTasksHelper.#renderTaskItem(task, handlers))}
      </ul>
    );
  }

  static #renderTaskItem(task, handlers) {
    return (
      <li key={task.id} className="list-group-item d-flex justify-content-between align-items-center">
        <div className="form-check">
          <input
            id={`game-task-${task.id}`}
            type="checkbox"
            className="form-check-input"
            checked={task.completed}
            onChange={() => handlers.onToggle(task)}
          />
          <label className="form-check-label" htmlFor={`game-task-${task.id}`}>
            {task.short_description}
          </label>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => handlers.onView(task)}
        >
          {Translator.t('game_tasks_page.view')}
        </button>
      </li>
    );
  }

  static #renderAddForm(formValues, fieldErrors, handlers) {
    return (
      <form className="mb-4" onSubmit={handlers.onCreate}>
        <FormField
          id="game-tasks-new-short-description"
          type="text"
          label={Translator.t('game_tasks_page.new_short_description_label')}
          value={formValues.shortDescription}
          onChange={(event) => handlers.onFormChange({ ...formValues, shortDescription: event.target.value })}
          errors={fieldErrors.short_description ?? []}
        />
        <TextareaField
          id="game-tasks-new-long-description"
          label={Translator.t('game_tasks_page.new_long_description_label')}
          value={formValues.longDescription}
          onChange={(event) => handlers.onFormChange({ ...formValues, longDescription: event.target.value })}
          errors={fieldErrors.long_description ?? []}
        />
        <SubmitButton>{Translator.t('game_tasks_page.add')}</SubmitButton>
      </form>
    );
  }
}
