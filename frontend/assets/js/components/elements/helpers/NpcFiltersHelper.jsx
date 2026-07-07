import React from 'react';
import Translator from '../../../i18n/Translator.js';

/**
 * Rendering helper for the NpcFilters element.
 */
export default class NpcFiltersHelper {
  /**
   * Renders the Status dropdown, Name text input, Query button and Clear button.
   *
   * @param {{status: string, name: string}} state - filters draft state.
   * @param {{onStatusChange: Function, onNameChange: Function, onQuery: Function,
   *   onClear: Function}} handlers - filters event handlers.
   * @returns {React.ReactElement} rendered filters bar.
   */
  static render(state, handlers) {
    return (
      <div className="row g-2 align-items-end mb-4" data-testid="npc-filters">
        <div className="col-auto">
          <label htmlFor="npc-filter-status" className="form-label">
            {Translator.t('game_npcs_page.filter_status_label')}
          </label>
          <select
            id="npc-filter-status"
            data-testid="npc-filter-status"
            className="form-select"
            value={state.status}
            onChange={(event) => handlers.onStatusChange(event.target.value)}
          >
            <option value="" />
            <option value="alive">{Translator.t('game_npcs_page.filter_status_alive')}</option>
            <option value="slain">{Translator.t('game_npcs_page.filter_status_slain')}</option>
          </select>
        </div>
        <div className="col-auto">
          <label htmlFor="npc-filter-name" className="form-label">
            {Translator.t('game_npcs_page.filter_name_label')}
          </label>
          <input
            id="npc-filter-name"
            data-testid="npc-filter-name"
            type="text"
            className="form-control"
            placeholder={Translator.t('game_npcs_page.filter_name_placeholder')}
            value={state.name}
            onChange={(event) => handlers.onNameChange(event.target.value)}
          />
        </div>
        <div className="col-auto">
          <button
            type="button"
            className="btn btn-primary"
            data-testid="npc-filter-query"
            onClick={handlers.onQuery}
          >
            {Translator.t('game_npcs_page.filter_query')}
          </button>
        </div>
        <div className="col-auto">
          <button
            type="button"
            className="btn btn-outline-secondary"
            data-testid="npc-filter-clear"
            onClick={handlers.onClear}
          >
            {Translator.t('game_npcs_page.filter_clear')}
          </button>
        </div>
      </div>
    );
  }
}
