import GameNavLinksHelper from './helpers/GameNavLinksHelper.jsx';

/**
 * Navigation links for a game's PCs, NPCs, and players pages.
 *
 * @param {object} props - Component props.
 * @param {string} props.gameSlug - The game slug used to build the link hrefs.
 * @returns {React.ReactElement} Navigation links element.
 */
export default function GameNavLinks({ gameSlug }) {
  return GameNavLinksHelper.render(gameSlug);
}
