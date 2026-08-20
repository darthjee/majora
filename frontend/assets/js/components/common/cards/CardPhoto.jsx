import defaultGamePhoto from '../../../../images/placeholders/default_game.png';

/**
 * Bootstrap card image that falls back to the default game photo when no URL is provided.
 *
 * @param {object} props - Component props.
 * @param {string|null} [props.url] - Image URL, or null/undefined to use the default photo.
 * @param {string} props.alt - Alt text for the image.
 * @param {string} [props.className] - Wrapper div class name, defaulting to the shared
 *   square photo box class used everywhere else this component is rendered.
 * @returns {React.ReactElement} Image element.
 */
export default function CardPhoto({ url, alt, className = 'card-photo-square' }) {
  return (
    <div className={className}>
      <img src={url || defaultGamePhoto} className="card-img-top" alt={alt} />
    </div>
  );
}
