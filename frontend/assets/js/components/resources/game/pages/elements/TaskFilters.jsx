import { useState } from 'react';
import TaskFiltersController from './controllers/TaskFiltersController.js';
import TaskFiltersHelper from './helpers/TaskFiltersHelper.jsx';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';

/**
 * Task filter bar rendered above the game tasks list, with a Category dropdown, a Status
 * dropdown (blank/pending/completed), a Query button and a Clear button. The draft fields are
 * pre-populated from the current hash's `category` and `completed` query params so deep-linked
 * filtered URLs restore the UI; unknown values start blank.
 *
 * @param {object} props - Component props.
 * @param {Function} props.onQuery - Called with the built `{category, completed}` query object
 *   (blank fields omitted) when the Query button is clicked.
 * @param {Function} props.onClear - Called when the Clear button is clicked, after the draft
 *   fields have been reset to blank.
 * @returns {React.ReactElement} rendered task filters bar.
 */
export default function TaskFilters({ onQuery, onClear }) {
  const initialFilters = TaskFiltersController.initialFilters(new HashRouteResolver().getFilterParams());
  const [category, setCategory] = useState(initialFilters.category);
  const [completed, setCompleted] = useState(initialFilters.completed);

  const controller = new TaskFiltersController(setCategory, setCompleted);

  const handleQuery = () => {
    onQuery(controller.buildQuery(category, completed));
  };

  const handleClear = () => {
    controller.clear();
    onClear();
  };

  return TaskFiltersHelper.render(
    { category, completed },
    {
      onCategoryChange: (value) => controller.handleCategoryChange(value),
      onCompletedChange: (value) => controller.handleCompletedChange(value),
      onQuery: handleQuery,
      onClear: handleClear,
    },
  );
}
