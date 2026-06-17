import defaultCharacterPhoto from '../../../images/default_character.png';

/**
 * Bootstrap card image for a character that falls back to the default avatar when no URL is provided.
 *
 * @param {object} props - Component props.
 * @param {string|null} [props.url] - Avatar URL, or null/undefined to use the default photo.
 * @param {string} props.alt - Alt text for the image.
 * @returns {React.ReactElement} Image element.
 */
export default function CardAvatar({ url, alt }) {
  return (
    <div className="card-photo-square">
      <img src={url || defaultCharacterPhoto} className="card-img-top" alt={alt} />
    </div>
  );
}
