import defaultFilePhoto from '../../../../images/placeholders/default_file.png';

/**
 * Bootstrap card image for a `GameDocumentFile` that falls back to the default file photo when
 * no URL is provided, mirroring `CardDocumentImage`.
 *
 * @param {object} props - Component props.
 * @param {string|null} [props.url] - Image URL, or null/undefined to use the default photo.
 * @param {string} props.alt - Alt text for the image.
 * @returns {React.ReactElement} Image element.
 */
export default function CardFileImage({ url, alt }) {
  return (
    <div className="card-photo-square">
      <img src={url || defaultFilePhoto} className="card-img-top" alt={alt} />
    </div>
  );
}
