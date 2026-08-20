import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the StaffUsersFilters element.
 */
export default class StaffUsersFiltersHelper {
  /**
   * Renders the Status dropdown, Search text input, Query button and Clear button.
   *
   * @param {{status: string, search: string}} state - filters draft state.
   * @param {{onStatusChange: Function, onSearchChange: Function, onQuery: Function,
   *   onClear: Function}} handlers - filters event handlers.
   * @returns {React.ReactElement} rendered filters bar.
   */
  static render(state, handlers) {
    return (
      <div className="row g-2 align-items-end mb-4" data-testid="staff-users-filters">
        {StaffUsersFiltersHelper.#renderStatusFilter(state, handlers)}
        {StaffUsersFiltersHelper.#renderSearchFilter(state, handlers)}
        {StaffUsersFiltersHelper.#renderActions(handlers)}
      </div>
    );
  }

  static #renderStatusFilter(state, handlers) {
    return (
      <div className="col-auto">
        <label htmlFor="staff-users-filter-status" className="form-label">
          {Translator.t('staff_users_page.filter_status_label')}
        </label>
        <select
          id="staff-users-filter-status"
          data-testid="staff-users-filter-status"
          className="form-select"
          value={state.status}
          onChange={(event) => handlers.onStatusChange(event.target.value)}
        >
          <option value="">{Translator.t('staff_users_page.filter_status_all')}</option>
          <option value="pending">{Translator.t('staff_users_page.status_pending')}</option>
          <option value="approved">{Translator.t('staff_users_page.status_approved')}</option>
          <option value="denied">{Translator.t('staff_users_page.status_denied')}</option>
        </select>
      </div>
    );
  }

  static #renderSearchFilter(state, handlers) {
    return (
      <div className="col-auto">
        <label htmlFor="staff-users-filter-search" className="form-label">
          {Translator.t('staff_users_page.filter_search_label')}
        </label>
        <input
          id="staff-users-filter-search"
          data-testid="staff-users-filter-search"
          type="text"
          className="form-control"
          placeholder={Translator.t('staff_users_page.filter_search_placeholder')}
          value={state.search}
          onChange={(event) => handlers.onSearchChange(event.target.value)}
        />
      </div>
    );
  }

  static #renderActions(handlers) {
    return (
      <>
        <div className="col-auto">
          <button
            type="button"
            className="btn btn-primary"
            data-testid="staff-users-filter-query"
            onClick={handlers.onQuery}
          >
            {Translator.t('staff_users_page.filter_query')}
          </button>
        </div>
        <div className="col-auto">
          <button
            type="button"
            className="btn btn-outline-secondary"
            data-testid="staff-users-filter-clear"
            onClick={handlers.onClear}
          >
            {Translator.t('staff_users_page.filter_clear')}
          </button>
        </div>
      </>
    );
  }
}
