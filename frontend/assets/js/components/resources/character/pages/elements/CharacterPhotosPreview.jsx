import CharacterPhotosPreviewHelper from './helpers/CharacterPhotosPreviewHelper.jsx';

/**
 * Preview section rendering a card grid for a limited number of a
 * character's photos, with a link to the full gallery page.
 *
 * @param {object} props - Component props.
 * @param {object[]} props.photos - List of photo objects (`id`, `path`).
 * @param {string} props.title - Section heading.
 * @param {string} props.seeAllHref - Hash href for the "See all" link.
 * @returns {React.ReactElement} Character photos preview section element.
 */
export default function CharacterPhotosPreview({ photos, title, seeAllHref }) {
  return CharacterPhotosPreviewHelper.render(photos, title, seeAllHref);
}
