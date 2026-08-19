import { useState } from 'react';

/**
 * Reusable hook bundling the links-edit modal's `show`/`links` state together with its
 * open/close/confirm handlers, so New/Edit character pages sharing the same
 * `LinksEditModal` wiring don't each duplicate this bookkeeping.
 *
 * @returns {{links: Array, setLinks: Function, showLinksModal: boolean, openLinksModal:
 *   Function, closeLinksModal: Function, confirmLinksModal: Function}} `links`/`setLinks` — the
 *   current links array and its raw setter (exposed for callers needing to seed it, e.g. after
 *   loading a character); `showLinksModal` — whether the modal is open; `openLinksModal` —
 *   opens the modal; `closeLinksModal` — closes the modal without changes; `confirmLinksModal`
 *   — applies the confirmed links and closes the modal.
 */
export default function useLinksModal() {
  const [links, setLinks] = useState([]);
  const [showLinksModal, setShowLinksModal] = useState(false);

  return {
    links,
    setLinks,
    showLinksModal,
    openLinksModal: () => setShowLinksModal(true),
    closeLinksModal: () => setShowLinksModal(false),
    confirmLinksModal: (newLinks) => {
      setLinks(newLinks);
      setShowLinksModal(false);
    },
  };
}
