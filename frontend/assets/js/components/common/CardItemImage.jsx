import defaultItemPhoto from '../../../images/placeholders/default_item.png';

/**
 * Bootstrap card image for a (game or character) item that falls back to the
 * default item photo when no URL is provided, mirroring `CardTreasureImage`.
 *
 * @param {object} props - Component props.
 * @param {string|null} [props.url] - Image URL, or null/undefined to use the default photo.
 * @param {string} props.alt - Alt text for the image.
 * @returns {React.ReactElement} Image element.
 */
export default function CardItemImage({ url, alt }) {
  return (
    <div className="card-photo-square">
      <img src={url || defaultItemPhoto} className="card-img-top" alt={alt} />
    </div>
  );
}
