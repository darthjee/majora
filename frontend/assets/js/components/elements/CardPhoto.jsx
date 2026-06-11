import defaultGamePhoto from '../../../images/default_game.png';

/**
 * Bootstrap card image that falls back to the default game photo when no URL is provided.
 *
 * @param {object} props - Component props.
 * @param {string|null} [props.url] - Image URL, or null/undefined to use the default photo.
 * @param {string} props.alt - Alt text for the image.
 * @returns {React.ReactElement} Image element.
 */
export default function CardPhoto({ url, alt }) {
  return <img src={url || defaultGamePhoto} className="card-img-top img-fluid" alt={alt} />;
}
