import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the PollFilters element.
 */
export default class PollFiltersHelper {
  /**
   * Renders the Status dropdown, Query button and Clear button.
   *
   * @param {{status: string}} state - filters draft state.
   * @param {{onStatusChange: Function, onQuery: Function, onClear: Function}} handlers - filters
   *   event handlers.
   * @returns {React.ReactElement} rendered filters bar.
   */
  static render(state, handlers) {
    return (
      <div className="row g-2 align-items-end mb-4" data-testid="poll-filters">
        <div className="col-auto">
          <label htmlFor="poll-filter-status" className="form-label">
            {Translator.t('game_polls_page.filter_status_label')}
          </label>
          <select
            id="poll-filter-status"
            data-testid="poll-filter-status"
            className="form-select"
            value={state.status}
            onChange={(event) => handlers.onStatusChange(event.target.value)}
          >
            <option value="" />
            <option value="open">{Translator.t('game_polls_page.status_open')}</option>
            <option value="inactive">{Translator.t('game_polls_page.status_inactive')}</option>
            <option value="closed">{Translator.t('game_polls_page.status_closed')}</option>
          </select>
        </div>
        <div className="col-auto">
          <button
            type="button"
            className="btn btn-primary"
            data-testid="poll-filter-query"
            onClick={handlers.onQuery}
          >
            {Translator.t('game_polls_page.filter_query')}
          </button>
        </div>
        <div className="col-auto">
          <button
            type="button"
            className="btn btn-outline-secondary"
            data-testid="poll-filter-clear"
            onClick={handlers.onClear}
          >
            {Translator.t('game_polls_page.filter_clear')}
          </button>
        </div>
      </div>
    );
  }
}
