import defaultCommonItemPhoto from '../../../../images/placeholders/default_common_item.png';

/**
 * Bootstrap card image for a `GameCommonItem` that falls back to the default common item photo
 * when no URL is provided, mirroring `CardPossessionImage`.
 *
 * @description No common-item-specific placeholder artwork was supplied with issue #826, so
 *   `default_common_item.png` is currently a copy of `default_possession.png` — flagged here
 *   rather than inventing new artwork; swap in dedicated art once it's supplied.
 * @param {object} props - Component props.
 * @param {string|null} [props.url] - Image URL, or null/undefined to use the default photo.
 * @param {string} props.alt - Alt text for the image.
 * @returns {React.ReactElement} Image element.
 */
export default function CardCommonItemImage({ url, alt }) {
  return (
    <div className="card-photo-square">
      <img src={url || defaultCommonItemPhoto} className="card-img-top" alt={alt} />
    </div>
  );
}
