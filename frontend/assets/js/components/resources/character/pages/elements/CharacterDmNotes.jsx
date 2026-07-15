import CharacterDmNotesHelper from './helpers/CharacterDmNotesHelper.jsx';

/**
 * Character show-page DM notes section, rendered only when the character
 * has a private description set.
 *
 * @param {object} props - Component props.
 * @param {string} [props.privateDescription] - Private description text.
 * @returns {React.ReactElement|null} DM notes section, or null.
 */
export default function CharacterDmNotes({ privateDescription }) {
  return CharacterDmNotesHelper.render(privateDescription);
}
