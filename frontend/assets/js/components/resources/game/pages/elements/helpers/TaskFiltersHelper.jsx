import React from 'react';
import FilterActions from '../../../../../common/forms/FilterActions.jsx';
import FilterSelect from '../../../../../common/forms/FilterSelect.jsx';
import SingleResourcePickerField from '../../../../../common/forms/SingleResourcePickerField.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import { TASK_CATEGORY_VALUES, translateTaskCategory } from '../../taskCategories.js';
import { buildSessionPicker } from '../../taskSessions.js';
import { SESSION_MODE_NONE, SESSION_MODE_SPECIFIC } from '../controllers/TaskFiltersController.js';

/**
 * Rendering helper for the TaskFilters element.
 */
export default class TaskFiltersHelper {
  /**
   * Renders the Category dropdown, Status (completed) dropdown, Session mode dropdown (plus the
   * session picker in the `specific` mode), Query button and Clear button.
   *
   * @param {{category: string, completed: string, sessionMode: string,
   *   sessionPick: ({id: number, name: string}|null), gameSlug: string}} state - filters draft
   *   state; `sessionMode` is `''`, `'none'` or `'specific'`.
   * @param {{onCategoryChange: Function, onCompletedChange: Function,
   *   onSessionModeChange: Function, onSessionPick: Function, onSessionClear: Function,
   *   onQuery: Function, onClear: Function}} handlers - filters event handlers.
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
        <FilterSelect
          id="task-filter-session"
          label={Translator.t('game_tasks_page.filter_session_label')}
          value={state.sessionMode ?? ''}
          onChange={handlers.onSessionModeChange}
          options={[
            { value: SESSION_MODE_NONE, label: Translator.t('game_tasks_page.filter_session_none') },
            { value: SESSION_MODE_SPECIFIC, label: Translator.t('game_tasks_page.filter_session_specific') },
          ]}
        />
        {TaskFiltersHelper.#renderSessionPicker(state, handlers)}
        <FilterActions onQuery={handlers.onQuery} onClear={handlers.onClear} testIdPrefix="task" />
      </div>
    );
  }

  static #renderSessionPicker(state, handlers) {
    if (state.sessionMode !== SESSION_MODE_SPECIFIC) {
      return null;
    }

    return (
      <div className="col-auto">
        <SingleResourcePickerField
          id="task-filter-session-pick"
          picker={buildSessionPicker(state.gameSlug)}
          value={state.sessionPick ?? null}
          onChange={handlers.onSessionPick}
          onClear={handlers.onSessionClear}
          label={Translator.t('game_tasks_page.filter_session_specific')}
          searchPlaceholder={Translator.t('game_tasks_page.filter_session_search_placeholder')}
        />
      </div>
    );
  }
}
