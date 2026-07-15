import CharacterTreasuresPreviewHelper from './helpers/CharacterTreasuresPreviewHelper.jsx';

/**
 * Preview section rendering a card grid for a limited number of a
 * character's treasures, with a link to the full list page.
 *
 * @param {object} props - Component props.
 * @param {object[]} props.treasures - List of owned treasure objects (`id`, `treasure_id`,
 *   `name`, `quantity`, `value`, `photo_path`).
 * @param {string} props.title - Section heading.
 * @param {string} props.seeAllHref - Hash href for the "See all" link.
 * @param {string} [props.gameType] - Currency model name (e.g. `dnd`, `deadlands`) of the
 *   character's own game, used to render each previewed treasure's value. Defaults to `dnd`.
 * @returns {React.ReactElement} Character treasures preview section element.
 */
export default function CharacterTreasuresPreview({
  treasures, title, seeAllHref, gameType = 'dnd',
}) {
  return CharacterTreasuresPreviewHelper.render(treasures, title, seeAllHref, gameType);
}
