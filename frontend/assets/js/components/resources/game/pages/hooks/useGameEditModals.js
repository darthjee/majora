import { useState } from 'react';

/**
 * Builds the callbacks driving GameEdit's upload and links modals. Extracted as a plain,
 * non-hook function so it can be exercised directly in specs (`useState` setters cannot be
 * meaningfully invoked under `renderToStaticMarkup`).
 *
 * @param {object} params - Builder parameters.
 * @param {object} params.controller - Game edit controller, whose `buildEffect()()` reloads the
 *   game after a successful upload.
 * @param {Function} params.setLinks - State setter for the game's links.
 * @param {Function} params.setShowUploadModal - State setter for the upload modal visibility.
 * @param {Function} params.setShowLinksModal - State setter for the links modal visibility.
 * @returns {object} The `onOpenUploadModal`/`onOpenLinksModal` openers, plus the `onUploadClose`,
 *   `onUploadSuccess`, `onLinksClose` and `onLinksConfirm` callbacks for `GameEditModals`.
 */
function buildModalCallbacks({
  controller, setLinks, setShowUploadModal, setShowLinksModal,
}) {
  return {
    onOpenUploadModal: () => setShowUploadModal(true),
    onOpenLinksModal: () => setShowLinksModal(true),
    onUploadClose: () => setShowUploadModal(false),
    onUploadSuccess: () => {
      setShowUploadModal(false);
      controller.buildEffect()();
    },
    onLinksClose: () => setShowLinksModal(false),
    onLinksConfirm: (newLinks) => {
      setLinks(newLinks);
      setShowLinksModal(false);
    },
  };
}

/**
 * Owns GameEdit's upload/links modal visibility state and the callbacks that drive it.
 *
 * @param {object} controller - Game edit controller, used to reload the game after a successful
 *   photo upload.
 * @param {Function} setLinks - State setter for the game's links, called when the links modal is
 *   confirmed.
 * @returns {{modalProps: object, onOpenUploadModal: Function, onOpenLinksModal: Function}}
 *   `modalProps` holds the visibility flags and close/success/confirm callbacks to spread into
 *   `GameEditModals`; the openers are meant for `GameEditHelper.render`'s handlers.
 */
export default function useGameEditModals(controller, setLinks) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const {
    onOpenUploadModal, onOpenLinksModal, ...callbacks
  } = buildModalCallbacks({
    controller, setLinks, setShowUploadModal, setShowLinksModal,
  });

  return {
    modalProps: { showUploadModal, showLinksModal, ...callbacks },
    onOpenUploadModal,
    onOpenLinksModal,
  };
}

export { buildModalCallbacks };
