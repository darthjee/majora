import { useState } from 'react';

/**
 * Builds the callbacks driving GameCommonItemEdit's upload and price modals. Extracted as a
 * plain, non-hook function so it can be exercised directly in specs (`useState` setters cannot
 * be meaningfully invoked under `renderToStaticMarkup`).
 *
 * @param {object} params - Builder parameters.
 * @param {object} params.controller - Common item edit controller, whose `buildEffect()()`
 *   reloads the common item after a successful upload.
 * @param {Function} params.setField - Form-state setter, called as `setField('price', value)`.
 * @param {Function} params.setShowUploadModal - State setter for the upload modal visibility.
 * @param {Function} params.setShowPriceModal - State setter for the price modal visibility.
 * @returns {object} The `onOpenUploadModal`/`onOpenPriceModal` openers, plus the `onUploadClose`,
 *   `onUploadSuccess`, `onPriceClose` and `onPriceConfirm` callbacks for
 *   `GameCommonItemEditModals`.
 */
function buildModalCallbacks({
  controller, setField, setShowUploadModal, setShowPriceModal,
}) {
  return {
    onOpenUploadModal: () => setShowUploadModal(true),
    onOpenPriceModal: () => setShowPriceModal(true),
    onUploadClose: () => setShowUploadModal(false),
    onUploadSuccess: () => {
      setShowUploadModal(false);
      controller.buildEffect()();
    },
    onPriceClose: () => setShowPriceModal(false),
    onPriceConfirm: (newTotal) => {
      setField('price', String(newTotal));
      setShowPriceModal(false);
    },
  };
}

/**
 * Owns GameCommonItemEdit's upload/price modal visibility state and the callbacks that drive it.
 *
 * @param {object} controller - Common item edit controller, used to reload the common item after
 *   a successful photo upload.
 * @param {Function} setField - Form-state setter, called as `setField('price', value)` when the
 *   price modal is confirmed.
 * @returns {{modalProps: object, onOpenUploadModal: Function, onOpenPriceModal: Function}}
 *   `modalProps` holds the visibility flags and close/success/confirm callbacks to spread into
 *   `GameCommonItemEditModals`; the openers are meant for `CommonItemEditHelper.render`'s
 *   handlers.
 */
export default function useCommonItemEditModals(controller, setField) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const {
    onOpenUploadModal, onOpenPriceModal, ...callbacks
  } = buildModalCallbacks({
    controller, setField, setShowUploadModal, setShowPriceModal,
  });

  return {
    modalProps: { showUploadModal, showPriceModal, ...callbacks },
    onOpenUploadModal,
    onOpenPriceModal,
  };
}

export { buildModalCallbacks };
