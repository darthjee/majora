import GameCardHelper from './helpers/GameCardHelper.jsx';

/**
 * Bootstrap card representing a single game.
 *
 * @param {object} props - Component props.
 * @param {object} props.game - Game data object.
 * @param {string} props.game.name - Game name.
 * @param {string} props.game.game_slug - Game slug used for the detail link.
 * @param {string|null} [props.game.photo] - Optional cover image URL.
 * @returns {React.ReactElement} Game card element.
 */
export default function GameCard({ game }) {
  return GameCardHelper.render(game);
}
