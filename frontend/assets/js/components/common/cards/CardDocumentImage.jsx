import defaultDocumentPhoto from '../../../images/placeholders/default_document.png';

/**
 * Bootstrap card image for a (game or character) document that falls back to the
 * default document photo when no URL is provided, mirroring `CardItemImage`.
 *
 * @param {object} props - Component props.
 * @param {string|null} [props.url] - Image URL, or null/undefined to use the default photo.
 * @param {string} props.alt - Alt text for the image.
 * @returns {React.ReactElement} Image element.
 */
export default function CardDocumentImage({ url, alt }) {
  return (
    <div className="card-photo-square">
      <img src={url || defaultDocumentPhoto} className="card-img-top" alt={alt} />
    </div>
  );
}
