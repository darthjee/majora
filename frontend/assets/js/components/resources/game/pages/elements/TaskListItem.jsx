import React from 'react';
import Badge from '../../../../common/badges/Badge.jsx';
import Translator from '../../../../../i18n/Translator.js';
import { translateTaskCategory } from '../taskCategories.js';

/**
 * Renders the session title of a task, or nothing when the task has no session.
 *
 * @param {object} props - Component props.
 * @param {({id: number, title: string}|null)} props.session - The task's session, or null.
 * @returns {React.ReactElement|null} Session title element, or null.
 */
function TaskSessionTitle({ session }) {
  if (!session) {
    return null;
  }

  return <small className="task-session ms-2 text-muted">{session.title}</small>;
}

/**
 * Shared task checklist row: a completion checkbox labelled with the task's short
 * description, its translated category badge, its session title (optional) and a
 * **View** button. Used by the game Tasks page and the session page tasks widget.
 *
 * @param {object} props - Component props.
 * @param {object} props.task - Task object (`id`, `short_description`, `completed`,
 *   `category`, `session`).
 * @param {Function} props.onToggle - Called with the task when its checkbox changes.
 * @param {Function} props.onView - Called with the task when the View button is clicked.
 * @param {boolean} [props.showSession] - Whether to render the task's session title.
 * @param {string} [props.idPrefix] - Prefix of the checkbox id (`<idPrefix>-<task.id>`),
 *   kept distinct per list so ids stay unique on a page.
 * @returns {React.ReactElement} Rendered task list item.
 */
export default function TaskListItem({
  task, onToggle, onView, showSession = true, idPrefix = 'game-task',
}) {
  const checkboxId = `${idPrefix}-${task.id}`;

  return (
    <li className="list-group-item d-flex justify-content-between align-items-center">
      <div className="form-check">
        <input
          id={checkboxId}
          type="checkbox"
          className="form-check-input"
          checked={task.completed}
          onChange={() => onToggle(task)}
        />
        <label className="form-check-label" htmlFor={checkboxId}>
          {task.short_description}
        </label>
        <span className="ms-2">
          <Badge text={translateTaskCategory(task.category)} />
        </span>
        {showSession ? <TaskSessionTitle session={task.session} /> : null}
      </div>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        onClick={() => onView(task)}
      >
        {Translator.t('game_tasks_page.view')}
      </button>
    </li>
  );
}
