import { useEffect, useState } from 'react';
import LinksEditModalHelper from './helpers/LinksEditModalHelper.jsx';
import LinksEditModalController from './controllers/LinksEditModalController.js';

/**
 * Modal for locally editing a character's links (add, edit text/URL/type, and
 * mark links for deletion) before committing the change together with the
 * rest of the character edit form. Holds its own local links state, seeded
 * from `props.links` whenever the modal opens, independent from the
 * character page's links state until confirmed.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {object[]} props.links - Character's current links array, used to seed
 *   the modal's local state whenever it opens.
 * @param {Function} props.onClose - Handler invoked when the modal is cancelled/dismissed,
 *   discarding local changes.
 * @param {Function} props.onConfirm - Handler invoked with the modal's local links array
 *   when the user confirms.
 * @returns {React.ReactElement} Rendered links edit modal.
 */
export default function LinksEditModal({ show, links, onClose, onConfirm }) {
  const [localLinks, setLocalLinks] = useState(LinksEditModalController.seedLinks(links));

  useEffect(() => {
    if (!show) return;
    setLocalLinks(LinksEditModalController.seedLinks(links));
  }, [show, links]);

  const updateLinkAt = (index, changes) => {
    setLocalLinks((current) => LinksEditModalController.updateLink(current, index, changes));
  };

  const handleAddLink = () => {
    setLocalLinks((current) => LinksEditModalController.addLink(current));
  };

  const handleToggleDelete = (index) => {
    setLocalLinks((current) => LinksEditModalController.toggleDelete(current, index));
  };

  const handleConfirm = () => onConfirm(localLinks);

  return LinksEditModalHelper.render(
    show,
    { links: localLinks, canConfirm: LinksEditModalController.canConfirm(localLinks) },
    {
      onClose,
      onConfirm: handleConfirm,
      onAddLink: handleAddLink,
      onToggleDelete: handleToggleDelete,
      onTextChange: (index, value) => updateLinkAt(index, { text: value }),
      onUrlChange: (index, value) => updateLinkAt(index, { url: value }),
      onLinkTypeChange: (index, value) => updateLinkAt(index, { link_type: value }),
    },
  );
}
