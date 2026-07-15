import CharacterAvatarFieldHelper from './helpers/CharacterAvatarFieldHelper.jsx';

/**
 * Editable avatar field shared by the character edit page and the NPC
 * creation page. On the edit page it is always editable; on the creation
 * page it is rendered as a non-interactive static placeholder (`canEdit`
 * false, no `url`/`onClick`), since avatar upload requires an existing
 * character id.
 *
 * @param {object} props - Component props.
 * @param {string|null} [props.url] - Profile photo path, or null/undefined for the placeholder.
 * @param {string} props.alt - Alt text for the avatar image.
 * @param {boolean} [props.canEdit] - Whether the upload overlay button is shown. Defaults to true.
 * @param {Function} [props.onClick] - Handler invoked when the upload button is clicked.
 * @returns {React.ReactElement} Avatar field element.
 */
export default function CharacterAvatarField({ url = null, alt, canEdit = true, onClick }) {
  return CharacterAvatarFieldHelper.render(url, alt, canEdit, onClick);
}
