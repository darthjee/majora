import React from 'react';
import FilterSelect from '../../../../../common/forms/FilterSelect.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the NpcFilters element.
 */
export default class NpcFiltersHelper {
  /**
   * Renders the public Status dropdown, public Allegiance dropdown, Name text input, Query
   * button and Clear button, plus the Hidden dropdown and the private Status/Allegiance
   * dropdowns (dm/admin only, gated on `state.canEdit`).
   *
   * @param {{status: string, name: string, allegiance: string, hidden: string,
   *   privateStatus: string, privateAllegiance: string, canEdit: boolean}} state - filters draft
   *   state. `canEdit` gates the Hidden dropdown and the private Status/Allegiance dropdowns.
   * @param {{onStatusChange: Function, onNameChange: Function, onAllegianceChange: Function,
   *   onHiddenChange: Function, onPrivateStatusChange: Function,
   *   onPrivateAllegianceChange: Function, onQuery: Function, onClear: Function}} handlers -
   *   filters event handlers.
   * @returns {React.ReactElement} rendered filters bar.
   */
  static render(state, handlers) {
    return (
      <div className="row g-2 align-items-end mb-4" data-testid="npc-filters">
        {NpcFiltersHelper.#renderPublicFilters(state, handlers)}
        {NpcFiltersHelper.#renderHiddenFilter(state, handlers)}
        {NpcFiltersHelper.#renderPrivateFilters(state, handlers)}
        {NpcFiltersHelper.#renderNameField(state, handlers)}
        {NpcFiltersHelper.#renderActions(handlers)}
      </div>
    );
  }

  /**
   * Renders the public Status and public Allegiance dropdowns.
   *
   * @param {{status: string, allegiance: string}} state - filters draft state.
   * @param {{onStatusChange: Function, onAllegianceChange: Function}} handlers - filters event
   *   handlers.
   * @returns {React.ReactElement} rendered public Status/Allegiance dropdowns.
   */
  static #renderPublicFilters(state, handlers) {
    return (
      <>
        <FilterSelect
          id="npc-filter-status"
          label={Translator.t('game_npcs_page.filter_public_status_label')}
          value={state.status}
          onChange={handlers.onStatusChange}
          options={[
            { value: 'alive', label: Translator.t('game_npcs_page.filter_public_status_alive') },
            { value: 'slain', label: Translator.t('game_npcs_page.filter_public_status_slain') },
          ]}
        />
        <FilterSelect
          id="npc-filter-allegiance"
          label={Translator.t('game_npcs_page.filter_public_allegiance_label')}
          value={state.allegiance}
          onChange={handlers.onAllegianceChange}
          options={[
            { value: 'ally', label: Translator.t('game_npcs_page.filter_public_allegiance_ally') },
            { value: 'enemy', label: Translator.t('game_npcs_page.filter_public_allegiance_enemy') },
            { value: 'neutral', label: Translator.t('game_npcs_page.filter_public_allegiance_neutral') },
          ]}
        />
      </>
    );
  }

  /**
   * Renders the Name text input block.
   *
   * @param {{name: string}} state - filters draft state.
   * @param {{onNameChange: Function}} handlers - filters event handlers.
   * @returns {React.ReactElement} rendered Name text input block.
   */
  static #renderNameField(state, handlers) {
    return (
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
    );
  }

  /**
   * Renders the Query and Clear buttons.
   *
   * @param {{onQuery: Function, onClear: Function}} handlers - filters event handlers.
   * @returns {React.ReactElement} rendered Query/Clear buttons.
   */
  static #renderActions(handlers) {
    return (
      <>
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
      </>
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

  /**
   * Renders the private Status and private Allegiance dropdowns, dm/admin only (gated on
   * `state.canEdit`).
   *
   * @param {{privateStatus: string, privateAllegiance: string, canEdit: boolean}} state - filters
   *   draft state.
   * @param {{onPrivateStatusChange: Function, onPrivateAllegianceChange: Function}} handlers -
   *   filters event handlers.
   * @returns {React.ReactElement|null} rendered private filters, or null when not an editor.
   */
  static #renderPrivateFilters(state, handlers) {
    if (!state.canEdit) {
      return null;
    }

    return (
      <>
        <FilterSelect
          id="npc-filter-private-status"
          label={Translator.t('game_npcs_page.filter_private_status_label')}
          value={state.privateStatus}
          onChange={handlers.onPrivateStatusChange}
          options={[
            { value: 'alive', label: Translator.t('game_npcs_page.filter_private_status_alive') },
            { value: 'slain', label: Translator.t('game_npcs_page.filter_private_status_slain') },
          ]}
        />
        <FilterSelect
          id="npc-filter-private-allegiance"
          label={Translator.t('game_npcs_page.filter_private_allegiance_label')}
          value={state.privateAllegiance}
          onChange={handlers.onPrivateAllegianceChange}
          options={[
            { value: 'ally', label: Translator.t('game_npcs_page.filter_private_allegiance_ally') },
            { value: 'enemy', label: Translator.t('game_npcs_page.filter_private_allegiance_enemy') },
            { value: 'neutral', label: Translator.t('game_npcs_page.filter_private_allegiance_neutral') },
          ]}
        />
      </>
    );
  }
}
