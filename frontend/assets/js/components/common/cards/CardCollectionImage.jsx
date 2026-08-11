import defaultCollectionPhoto from '../../../../images/placeholders/default_collection.png';

/**
 * Bootstrap card image for a collection that falls back to the default
 * collection photo when no URL is provided.
 *
 * @param {object} props - Component props.
 * @param {string|null} [props.url] - Image URL, or null/undefined to use the default photo.
 * @param {string} props.alt - Alt text for the image.
 * @returns {React.ReactElement} Image element.
 */
export default function CardCollectionImage({ url, alt }) {
  return (
    <div className="card-photo-square">
      <img src={url || defaultCollectionPhoto} className="card-img-top" alt={alt} />
    </div>
  );
}
