import KickConfirmModalHelper from './helpers/KickConfirmModalHelper.jsx';

/**
 * Confirmation modal shown before kicking a character from a faction (issue #1106), matching the
 * shape already repeated by `DeletePhotoConfirmModal`/`SlainConfirmModal`/`ClearCacheConfirmModal`.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {string} props.characterName - Name of the character pending removal.
 * @param {string} props.factionName - Name of the faction the character would be removed from.
 * @param {boolean} [props.submitting] - Whether the kick request is currently in flight, disabling
 *   the Confirm button to prevent double-submits. Defaults to `false`.
 * @param {Function} props.onConfirm - Handler invoked when the Kick button is clicked.
 * @param {Function} props.onCancel - Handler invoked when the modal is dismissed/cancelled.
 * @returns {React.ReactElement} Rendered kick confirmation modal.
 */
export default function KickConfirmModal({
  show, characterName, factionName, submitting = false, onConfirm, onCancel,
}) {
  return KickConfirmModalHelper.render(show, characterName, factionName, submitting, { onConfirm, onCancel });
}
