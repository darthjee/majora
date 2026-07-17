import { useState } from 'react';
import TreasureFiltersController from './controllers/TreasureFiltersController.js';
import TreasureFiltersHelper from './helpers/TreasureFiltersHelper.jsx';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';

/**
 * Treasure filter/search bar rendered above the treasures list, with a Game type
 * dropdown, Min/Max value inputs, a Name text search, a Query button and a Clear
 * button. Draft fields are pre-populated from the current hash's `game_type`/
 * `min_value`/`max_value`/`name` query params so deep-linked filtered URLs restore
 * the UI.
 *
 * @param {object} props - Component props.
 * @param {Function} props.onQuery - Called with the built `{game_type, min_value,
 *   max_value, name}` query object (blank fields omitted) when the Query button is clicked.
 * @param {Function} props.onClear - Called when the Clear button is clicked, after the
 *   draft fields have been reset to blank.
 * @param {boolean} [props.showGameType] - Whether to render the Game type dropdown. Defaults
 *   to `true`; pages already scoped to a single game pass `false` to hide it and omit
 *   `game_type` from the built query.
 * @returns {React.ReactElement} rendered treasure filters bar.
 */
export default function TreasureFilters({ onQuery, onClear, showGameType = true }) {
  const initialFilters = new HashRouteResolver().getFilterParams();
  const [gameType, setGameType] = useState(initialFilters.get('game_type') ?? '');
  const [minValue, setMinValue] = useState(initialFilters.get('min_value') ?? '');
  const [maxValue, setMaxValue] = useState(initialFilters.get('max_value') ?? '');
  const [name, setName] = useState(initialFilters.get('name') ?? '');

  const controller = new TreasureFiltersController(setGameType, setMinValue, setMaxValue, setName);

  const handleQuery = () => {
    onQuery(controller.buildQuery(gameType, minValue, maxValue, name));
  };

  const handleClear = () => {
    controller.clear();
    onClear();
  };

  return TreasureFiltersHelper.render(
    {
      gameType, minValue, maxValue, name,
    },
    {
      onGameTypeChange: (value) => controller.handleGameTypeChange(value),
      onMinValueChange: (value) => controller.handleMinValueChange(value),
      onMaxValueChange: (value) => controller.handleMaxValueChange(value),
      onNameChange: (value) => controller.handleNameChange(value),
      onQuery: handleQuery,
      onClear: handleClear,
    },
    showGameType,
  );
}
