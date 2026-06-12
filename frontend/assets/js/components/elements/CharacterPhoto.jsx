/**
 * A single character photo in the gallery grid.
 *
 * @param {object} props - Component props.
 * @param {string} props.url - Photo URL.
 * @param {string} props.alt - Alt text for the image.
 * @returns {React.ReactElement} Photo element.
 */
export default function CharacterPhoto({ url, alt }) {
  return (
    <div className="col-sm-6 col-md-4 mb-3">
      <img src={url} className="img-fluid rounded" alt={alt} />
    </div>
  );
}
