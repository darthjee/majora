import SlainConfirmModalHelper from './helpers/SlainConfirmModalHelper.jsx';

/**
 * Confirmation modal shown before toggling an NPC's slain or public_slain state.
 *
 * @param {{show: boolean, slain: boolean, isPublic: boolean, onConfirm: Function, onCancel: Function}} props - Component props.
 * @returns {React.ReactElement} Rendered slain confirmation modal.
 */
export default function SlainConfirmModal({
  show, slain, isPublic = false, onConfirm, onCancel,
}) {
  return SlainConfirmModalHelper.render(show, slain, isPublic, { onConfirm, onCancel });
}
