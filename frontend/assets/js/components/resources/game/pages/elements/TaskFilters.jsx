import { useEffect, useMemo, useState } from 'react';
import TaskFiltersController from './controllers/TaskFiltersController.js';
import TaskFiltersHelper from './helpers/TaskFiltersHelper.jsx';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';

/**
 * Task filter bar rendered above the game tasks list, with a Category dropdown, a Status
 * dropdown (blank/pending/completed), a Session dropdown (blank/no session/specific session,
 * the latter revealing a session picker), a Query button and a Clear button. The draft fields
 * are pre-populated from the current hash's `category`, `completed` and `session` query params
 * so deep-linked filtered URLs restore the UI; unknown values start blank. A deep-linked
 * `session=<id>` fetches that session once to show its title in the picker.
 *
 * @param {object} props - Component props.
 * @param {string} props.gameSlug - Slug of the tasks' game, used to scope the session picker.
 * @param {Function} props.onQuery - Called with the built `{category, completed, session}` query
 *   object (blank fields omitted) when the Query button is clicked.
 * @param {Function} props.onClear - Called when the Clear button is clicked, after the draft
 *   fields have been reset to blank.
 * @returns {React.ReactElement} rendered task filters bar.
 */
export default function TaskFilters({ gameSlug, onQuery, onClear }) {
  const initialFilters = TaskFiltersController.initialFilters(new HashRouteResolver().getFilterParams());
  const initialSessionId = initialFilters.sessionId;
  const [category, setCategory] = useState(initialFilters.category);
  const [completed, setCompleted] = useState(initialFilters.completed);
  const [sessionMode, setSessionMode] = useState(initialFilters.sessionMode);
  const [sessionPick, setSessionPick] = useState(null);

  const controller = useMemo(
    () => new TaskFiltersController(setCategory, setCompleted, setSessionMode, setSessionPick),
    [],
  );

  useEffect(
    () => controller.buildSessionPickEffect(gameSlug, initialSessionId)(),
    [controller, gameSlug, initialSessionId],
  );

  const handleQuery = () => {
    onQuery(controller.buildQuery(category, completed, sessionMode, sessionPick));
  };

  const handleClear = () => {
    controller.clear();
    onClear();
  };

  return TaskFiltersHelper.render(
    {
      category, completed, sessionMode, sessionPick, gameSlug,
    },
    {
      onCategoryChange: (value) => controller.handleCategoryChange(value),
      onCompletedChange: (value) => controller.handleCompletedChange(value),
      onSessionModeChange: (value) => controller.handleSessionModeChange(value),
      onSessionPick: (item) => controller.handleSessionPick(item),
      onSessionClear: () => controller.handleSessionPick(null),
      onQuery: handleQuery,
      onClear: handleClear,
    },
  );
}
