import defaultSourcePhoto from '../../../../images/placeholders/default_source.png';

/**
 * Bootstrap card image for a source that falls back to the default
 * source photo when no URL is provided.
 *
 * @param {object} props - Component props.
 * @param {string|null} [props.url] - Image URL, or null/undefined to use the default photo.
 * @param {string} props.alt - Alt text for the image.
 * @returns {React.ReactElement} Image element.
 */
export default function CardSourceImage({ url, alt }) {
  return (
    <div className="card-photo-square">
      <img src={url || defaultSourcePhoto} className="card-img-top" alt={alt} />
    </div>
  );
}
