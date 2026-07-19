import MyGamesHelper from './helpers/MyGamesHelper.jsx';

/**
 * Render the my-games index page, listing every game the current user belongs to.
 *
 * @returns {React.ReactElement} My games page.
 */
export default function MyGames() {
  return MyGamesHelper.render();
}
