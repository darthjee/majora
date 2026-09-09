import ClearCrawlerConfirmModalHelper from './helpers/ClearCrawlerConfirmModalHelper.jsx';

/**
 * Confirmation modal shown before clearing every captured crawler debug entry.
 *
 * @param {{show: boolean, onConfirm: Function, onCancel: Function}} props - Component props.
 * @returns {React.ReactElement} Rendered clear-crawler confirmation modal.
 */
export default function ClearCrawlerConfirmModal({ show, onConfirm, onCancel }) {
  return ClearCrawlerConfirmModalHelper.render(show, { onConfirm, onCancel });
}
