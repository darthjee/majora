import defaultGamePhoto from '../../../images/placeholders/default_game.png';

/**
 * Bootstrap card image that falls back to the default game photo when no URL is provided.
 *
 * @param {object} props - Component props.
 * @param {string|null} [props.url] - Image URL, or null/undefined to use the default photo.
 * @param {string} props.alt - Alt text for the image.
 * @returns {React.ReactElement} Image element.
 */
export default function CardPhoto({ url, alt }) {
  return (
    <div className="card-photo-square">
      <img src={url || defaultGamePhoto} className="card-img-top" alt={alt} />
    </div>
  );
}
