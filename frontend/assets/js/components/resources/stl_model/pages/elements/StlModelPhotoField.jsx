import ActionsOverlay from '../../../../common/misc/ActionsOverlay.jsx';

/**
 * Editable photo field for the STL model creation page. Picking a photo opens the upload modal
 * in its deferred mode, which keeps the picked file in local state (shown here as a local
 * preview `url`) until the STL model is created and the photo can actually be uploaded. Before a
 * photo is picked, `url` stays null/undefined and this renders the default `default_stl_model.png`
 * placeholder image (via `ActionsOverlay`'s `'stl_model'` photo component).
 *
 * @param {object} props - Component props.
 * @param {string|null} [props.url] - Local preview photo path, or null/undefined for the placeholder.
 * @param {string} props.alt - Alt text for the photo image.
 * @param {Function} props.onClick - Handler invoked when the upload button is clicked.
 * @returns {React.ReactElement} STL model photo field element.
 */
export default function StlModelPhotoField({ url = null, alt, onClick }) {
  return (
    <ActionsOverlay
      type="stl_model"
      url={url}
      alt={alt}
      canEdit
      onClick={onClick}
    />
  );
}
