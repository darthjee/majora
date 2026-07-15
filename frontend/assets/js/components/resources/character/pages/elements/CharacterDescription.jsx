import CharacterDescriptionHelper from './helpers/CharacterDescriptionHelper.jsx';

/**
 * Character show-page description panel, rendered only when a description
 * is set.
 *
 * @param {object} props - Component props.
 * @param {string} [props.description] - Character description.
 * @returns {React.ReactElement|null} Description panel, or null.
 */
export default function CharacterDescription({ description }) {
  return CharacterDescriptionHelper.render(description);
}
