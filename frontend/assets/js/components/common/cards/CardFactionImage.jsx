import defaultFactionPhoto from '../../../../images/placeholders/default_faction.png';

/**
 * Bootstrap card image for a `Faction` that falls back to the default faction photo when no URL
 * is provided, mirroring `CardPossessionImage`/`CardItemImage`.
 *
 * @description No faction-specific placeholder artwork was supplied with issue #812 —
 *   `default_faction.png` is currently a copy of `default_item.png` — flagged here rather than
 *   inventing new artwork; swap in dedicated art once it's supplied.
 * @param {object} props - Component props.
 * @param {string|null} [props.url] - Image URL, or null/undefined to use the default photo.
 * @param {string} props.alt - Alt text for the image.
 * @returns {React.ReactElement} Image element.
 */
export default function CardFactionImage({ url, alt }) {
  return (
    <div className="card-photo-square">
      <img src={url || defaultFactionPhoto} className="card-img-top" alt={alt} />
    </div>
  );
}
