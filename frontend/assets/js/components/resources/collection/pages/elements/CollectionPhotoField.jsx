import ActionsOverlay from '../../../../common/misc/ActionsOverlay.jsx';

/**
 * Editable photo field for the collection creation modal. Picking a photo opens the upload modal
 * in its deferred mode, which keeps the picked file in local state (shown here as a local
 * preview `url`) until the collection is created and the photo can actually be uploaded. Before a
 * photo is picked, `url` stays null/undefined and this renders the default `default_collection.png`
 * placeholder image (via `ActionsOverlay`'s `'collection'` photo component).
 *
 * @param {object} props - Component props.
 * @param {string|null} [props.url] - Local preview photo path, or null/undefined for the placeholder.
 * @param {string} props.alt - Alt text for the photo image.
 * @param {Function} props.onClick - Handler invoked when the upload button is clicked.
 * @returns {React.ReactElement} Collection photo field element.
 */
export default function CollectionPhotoField({ url = null, alt, onClick }) {
  return (
    <ActionsOverlay
      type="collection"
      url={url}
      alt={alt}
      canEdit
      onClick={onClick}
    />
  );
}
