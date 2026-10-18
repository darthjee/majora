import ApiTokenGamesPickerHelper from './helpers/ApiTokenGamesPickerHelper.jsx';
import { applyGamesSelection } from './ApiTokenGamesSelection.js';

export { MAX_GAMES } from './ApiTokenGamesSelection.js';

/**
 * Controlled games picker of the create API token form (issue #1605): a searchable multi-select
 * over the reachable games from `options.json`, capped at `MAX_GAMES`, with the empty-selection,
 * superuser and no-games notes.
 *
 * @param {object} props - Component props.
 * @param {Array<{slug: string, name: string}>} props.value - Selected games.
 * @param {{games: Array<{slug: string, name: string}>, all_games: boolean}} props.options -
 *   The `options.json` payload.
 * @param {Function} props.onChange - Called with the new selection.
 * @param {object} [props.errors] - Form field errors (`games` is used).
 * @returns {React.ReactElement} Rendered games picker.
 */
export default function ApiTokenGamesPicker({
  value, options, onChange, errors = {},
}) {
  return ApiTokenGamesPickerHelper.render(
    {
      value, games: options.games, allGames: options.all_games, errors: errors.games ?? [],
    },
    { onChange: (picked) => onChange(applyGamesSelection(value, picked)) },
  );
}
