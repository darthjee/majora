import defaultPossessionPhoto from '../../../../images/placeholders/default_possession.png';

/**
 * Bootstrap card image for a `GamePossession` that falls back to the default possession photo
 * when no URL is provided, mirroring `CardItemImage`.
 *
 * @description No possession-specific placeholder artwork was supplied with issue #1074, so
 *   `default_possession.png` is currently a copy of `default_item.png` — flagged here rather than
 *   inventing new artwork; swap in dedicated art once it's supplied.
 * @param {object} props - Component props.
 * @param {string|null} [props.url] - Image URL, or null/undefined to use the default photo.
 * @param {string} props.alt - Alt text for the image.
 * @returns {React.ReactElement} Image element.
 */
export default function CardPossessionImage({ url, alt }) {
  return (
    <div className="card-photo-square">
      <img src={url || defaultPossessionPhoto} className="card-img-top" alt={alt} />
    </div>
  );
}
