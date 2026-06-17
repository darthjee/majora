import CharacterPreviewSectionHelper from './helpers/CharacterPreviewSectionHelper.jsx';

/**
 * Preview section listing a limited number of characters with a link to
 * see the full list.
 *
 * @param {object} props - Component props.
 * @param {object[]} props.characters - List of character objects.
 * @param {string} props.gameSlug - Game slug used to build each card's detail link.
 * @param {string} props.characterType - Character type, either 'pc' or 'npc'.
 * @param {string} props.title - Section heading.
 * @param {string} props.seeAllHref - Hash href for the "See all" link.
 * @returns {React.ReactElement} Character preview section element.
 */
export default function CharacterPreviewSection({
  characters, gameSlug, characterType, title, seeAllHref,
}) {
  return CharacterPreviewSectionHelper.render(characters, gameSlug, characterType, title, seeAllHref);
}
