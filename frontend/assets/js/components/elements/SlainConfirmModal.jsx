import SlainConfirmModalHelper from './helpers/SlainConfirmModalHelper.jsx';

/**
 * Confirmation modal shown before toggling an NPC's slain state.
 *
 * @param {{show: boolean, slain: boolean, onConfirm: Function, onCancel: Function}} props - Component props.
 * @returns {React.ReactElement} Rendered slain confirmation modal.
 */
export default function SlainConfirmModal({ show, slain, onConfirm, onCancel }) {
  return SlainConfirmModalHelper.render(show, slain, { onConfirm, onCancel });
}
