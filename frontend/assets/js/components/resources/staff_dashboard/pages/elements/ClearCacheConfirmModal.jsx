import ClearCacheConfirmModalHelper from './helpers/ClearCacheConfirmModalHelper.jsx';

/**
 * Confirmation modal shown before clearing a cache (memory or disk).
 *
 * @param {{show: boolean, onConfirm: Function, onCancel: Function}} props - Component props.
 * @returns {React.ReactElement} Rendered clear-cache confirmation modal.
 */
export default function ClearCacheConfirmModal({ show, onConfirm, onCancel }) {
  return ClearCacheConfirmModalHelper.render(show, { onConfirm, onCancel });
}
