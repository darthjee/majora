import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the TreasureFilters element.
 */
export default class TreasureFiltersHelper {
  /**
   * Renders the Game type dropdown, Min/Max value inputs, Name text input, Query button and
   * Clear button.
   *
   * @param {{gameType: string, minValue: string, maxValue: string, name: string}} state -
   *   filters draft state.
   * @param {{onGameTypeChange: Function, onMinValueChange: Function, onMaxValueChange: Function,
   *   onNameChange: Function, onQuery: Function, onClear: Function}} handlers - filters
   *   event handlers.
   * @returns {React.ReactElement} rendered filters bar.
   */
  static render(state, handlers) {
    return (
      <div className="row g-2 align-items-end mb-4" data-testid="treasure-filters">
        <div className="col-auto">
          <label htmlFor="treasure-filter-game-type" className="form-label">
            {Translator.t('treasures_page.filter_game_type_label')}
          </label>
          <select
            id="treasure-filter-game-type"
            data-testid="treasure-filter-game-type"
            className="form-select"
            value={state.gameType}
            onChange={(event) => handlers.onGameTypeChange(event.target.value)}
          >
            <option value="" />
            <option value="dnd">D&amp;D</option>
            <option value="deadlands">Deadlands</option>
          </select>
        </div>
        <div className="col-auto">
          <label htmlFor="treasure-filter-min-value" className="form-label">
            {Translator.t('treasures_page.filter_min_value_label')}
          </label>
          <input
            id="treasure-filter-min-value"
            data-testid="treasure-filter-min-value"
            type="number"
            className="form-control"
            value={state.minValue}
            onChange={(event) => handlers.onMinValueChange(event.target.value)}
          />
        </div>
        <div className="col-auto">
          <label htmlFor="treasure-filter-max-value" className="form-label">
            {Translator.t('treasures_page.filter_max_value_label')}
          </label>
          <input
            id="treasure-filter-max-value"
            data-testid="treasure-filter-max-value"
            type="number"
            className="form-control"
            value={state.maxValue}
            onChange={(event) => handlers.onMaxValueChange(event.target.value)}
          />
        </div>
        <div className="col-auto">
          <label htmlFor="treasure-filter-name" className="form-label">
            {Translator.t('treasures_page.filter_name_label')}
          </label>
          <input
            id="treasure-filter-name"
            data-testid="treasure-filter-name"
            type="text"
            className="form-control"
            placeholder={Translator.t('treasures_page.filter_name_placeholder')}
            value={state.name}
            onChange={(event) => handlers.onNameChange(event.target.value)}
          />
        </div>
        <div className="col-auto">
          <button
            type="button"
            className="btn btn-primary"
            data-testid="treasure-filter-query"
            onClick={handlers.onQuery}
          >
            {Translator.t('treasures_page.filter_query')}
          </button>
        </div>
        <div className="col-auto">
          <button
            type="button"
            className="btn btn-outline-secondary"
            data-testid="treasure-filter-clear"
            onClick={handlers.onClear}
          >
            {Translator.t('treasures_page.filter_clear')}
          </button>
        </div>
      </div>
    );
  }
}
