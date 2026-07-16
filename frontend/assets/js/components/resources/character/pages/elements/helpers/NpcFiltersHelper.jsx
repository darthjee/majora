import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the NpcFilters element.
 */
export default class NpcFiltersHelper {
  /**
   * Renders the Status dropdown, Name text input, Query button and Clear button, plus the
   * Hidden dropdown (dm/admin only, gated on `state.canEdit`).
   *
   * @param {{status: string, name: string, allegiance: string, hidden: string,
   *   canEdit: boolean}} state - filters draft state. `canEdit` gates the Hidden dropdown.
   * @param {{onStatusChange: Function, onNameChange: Function, onAllegianceChange: Function,
   *   onHiddenChange: Function, onQuery: Function, onClear: Function}} handlers - filters
   *   event handlers.
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
          <label htmlFor="npc-filter-allegiance" className="form-label">
            {Translator.t('game_npcs_page.filter_allegiance_label')}
          </label>
          <select
            id="npc-filter-allegiance"
            data-testid="npc-filter-allegiance"
            className="form-select"
            value={state.allegiance}
            onChange={(event) => handlers.onAllegianceChange(event.target.value)}
          >
            <option value="" />
            <option value="ally">{Translator.t('game_npcs_page.filter_allegiance_ally')}</option>
            <option value="enemy">{Translator.t('game_npcs_page.filter_allegiance_enemy')}</option>
            <option value="neutral">{Translator.t('game_npcs_page.filter_allegiance_neutral')}</option>
          </select>
        </div>
        {NpcFiltersHelper.#renderHiddenFilter(state, handlers)}
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

  /**
   * Renders the Hidden dropdown, dm/admin only (gated on `state.canEdit`).
   *
   * @param {{hidden: string, canEdit: boolean}} state - filters draft state.
   * @param {{onHiddenChange: Function}} handlers - filters event handlers.
   * @returns {React.ReactElement|null} rendered Hidden dropdown, or null when not an editor.
   */
  static #renderHiddenFilter(state, handlers) {
    if (!state.canEdit) {
      return null;
    }

    return (
      <div className="col-auto">
        <label htmlFor="npc-filter-hidden" className="form-label">
          {Translator.t('game_npcs_page.filter_hidden_label')}
        </label>
        <select
          id="npc-filter-hidden"
          data-testid="npc-filter-hidden"
          className="form-select"
          value={state.hidden}
          onChange={(event) => handlers.onHiddenChange(event.target.value)}
        >
          <option value="" />
          <option value="shown">{Translator.t('game_npcs_page.filter_hidden_shown')}</option>
          <option value="hidden">{Translator.t('game_npcs_page.filter_hidden_only')}</option>
        </select>
      </div>
    );
  }
}
