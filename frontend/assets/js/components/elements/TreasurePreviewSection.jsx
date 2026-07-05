import TreasurePreviewSectionHelper from './helpers/TreasurePreviewSectionHelper.jsx';

/**
 * Preview section listing a limited number of a character's treasures with a
 * link to see the full list.
 *
 * @param {object} props - Component props.
 * @param {object[]} props.treasures - List of treasure objects (`id`, `name`, `quantity`).
 * @param {string} props.title - Section heading.
 * @param {string} props.seeAllHref - Hash href for the "See all" link.
 * @returns {React.ReactElement} Treasure preview section element.
 */
export default function TreasurePreviewSection({ treasures, title, seeAllHref }) {
  return TreasurePreviewSectionHelper.render(treasures, title, seeAllHref);
}
