import React from 'react';
import FilterActions from '../../../../../common/forms/FilterActions.jsx';
import FilterSelect from '../../../../../common/forms/FilterSelect.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import { TASK_CATEGORY_VALUES, translateTaskCategory } from '../../taskCategories.js';

/**
 * Rendering helper for the TaskFilters element.
 */
export default class TaskFiltersHelper {
  /**
   * Renders the Category dropdown, Status (completed) dropdown, Query button and Clear button.
   *
   * @param {{category: string, completed: string}} state - filters draft state.
   * @param {{onCategoryChange: Function, onCompletedChange: Function, onQuery: Function,
   *   onClear: Function}} handlers - filters event handlers.
   * @returns {React.ReactElement} rendered filters bar.
   */
  static render(state, handlers) {
    return (
      <div className="row g-2 align-items-end mb-4" data-testid="task-filters">
        <FilterSelect
          id="task-filter-category"
          label={Translator.t('game_tasks_page.filter_category_label')}
          value={state.category}
          onChange={handlers.onCategoryChange}
          options={TASK_CATEGORY_VALUES.map((value) => ({ value, label: translateTaskCategory(value) }))}
        />
        <FilterSelect
          id="task-filter-completed"
          label={Translator.t('game_tasks_page.filter_completed_label')}
          value={state.completed}
          onChange={handlers.onCompletedChange}
          options={[
            { value: 'false', label: Translator.t('game_tasks_page.filter_completed_pending') },
            { value: 'true', label: Translator.t('game_tasks_page.filter_completed_done') },
          ]}
        />
        <FilterActions onQuery={handlers.onQuery} onClear={handlers.onClear} testIdPrefix="task" />
      </div>
    );
  }
}
