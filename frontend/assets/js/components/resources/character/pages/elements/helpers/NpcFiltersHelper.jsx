import React from 'react';
import FilterSelect from '../../../../../common/forms/FilterSelect.jsx';
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
        <FilterSelect
          id="npc-filter-status"
          label={Translator.t('game_npcs_page.filter_status_label')}
          value={state.status}
          onChange={handlers.onStatusChange}
          options={[
            { value: 'alive', label: Translator.t('game_npcs_page.filter_status_alive') },
            { value: 'slain', label: Translator.t('game_npcs_page.filter_status_slain') },
          ]}
        />
        <FilterSelect
          id="npc-filter-allegiance"
          label={Translator.t('game_npcs_page.filter_allegiance_label')}
          value={state.allegiance}
          onChange={handlers.onAllegianceChange}
          options={[
            { value: 'ally', label: Translator.t('game_npcs_page.filter_allegiance_ally') },
            { value: 'enemy', label: Translator.t('game_npcs_page.filter_allegiance_enemy') },
            { value: 'neutral', label: Translator.t('game_npcs_page.filter_allegiance_neutral') },
          ]}
        />
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
      <FilterSelect
        id="npc-filter-hidden"
        label={Translator.t('game_npcs_page.filter_hidden_label')}
        value={state.hidden}
        onChange={handlers.onHiddenChange}
        options={[
          { value: 'shown', label: Translator.t('game_npcs_page.filter_hidden_shown') },
          { value: 'hidden', label: Translator.t('game_npcs_page.filter_hidden_only') },
        ]}
      />
    );
  }
}
