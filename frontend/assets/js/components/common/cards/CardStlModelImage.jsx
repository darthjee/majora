import defaultStlModelPhoto from '../../../../images/placeholders/default_stl_model.png';

/**
 * Bootstrap card image for an STL model that falls back to the default
 * STL model photo when no URL is provided.
 *
 * @param {object} props - Component props.
 * @param {string|null} [props.url] - Image URL, or null/undefined to use the default photo.
 * @param {string} props.alt - Alt text for the image.
 * @returns {React.ReactElement} Image element.
 */
export default function CardStlModelImage({ url, alt }) {
  return (
    <div className="card-photo-square">
      <img src={url || defaultStlModelPhoto} className="card-img-top" alt={alt} />
    </div>
  );
}
