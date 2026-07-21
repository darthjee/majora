import CharacterAvatarFieldHelper from './helpers/CharacterAvatarFieldHelper.jsx';

/**
 * Editable avatar field shared by the character edit page and the NPC
 * creation page. On the edit page it is always editable. On the creation
 * page it is also editable: picking a photo there opens the upload modal
 * in its deferred mode, which keeps the picked file in local state (shown
 * here as a local preview `url`) until the NPC is created and the photo can
 * actually be uploaded. Before a photo is picked, `url` stays null/undefined
 * and this renders its default static placeholder image.
 *
 * @param {object} props - Component props.
 * @param {string|null} [props.url] - Profile photo path, or null/undefined for the placeholder.
 * @param {string} props.alt - Alt text for the avatar image.
 * @param {boolean} [props.canEdit] - Whether the upload overlay button is shown. Defaults to true.
 * @param {Function} [props.onClick] - Handler invoked when the upload button is clicked.
 * @param {boolean} [props.dimmed] - Whether to render the avatar with reduced opacity
 *   (e.g. a hidden NPC).
 * @returns {React.ReactElement} Avatar field element.
 */
export default function CharacterAvatarField({
  url = null, alt, canEdit = true, onClick, dimmed = false,
}) {
  return CharacterAvatarFieldHelper.render(url, alt, canEdit, onClick, dimmed);
}
