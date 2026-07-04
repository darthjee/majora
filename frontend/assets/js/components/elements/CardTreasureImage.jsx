import defaultTreasurePhoto from '../../../images/default_treasure.png';

/**
 * Bootstrap card image for a treasure that falls back to the default
 * treasure photo when no URL is provided.
 *
 * @param {object} props - Component props.
 * @param {string|null} [props.url] - Image URL, or null/undefined to use the default photo.
 * @param {string} props.alt - Alt text for the image.
 * @returns {React.ReactElement} Image element.
 */
export default function CardTreasureImage({ url, alt }) {
  return (
    <div className="card-photo-square">
      <img src={url || defaultTreasurePhoto} className="card-img-top" alt={alt} />
    </div>
  );
}
