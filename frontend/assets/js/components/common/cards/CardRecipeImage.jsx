import defaultCommonItemPhoto from '../../../../images/placeholders/default_common_item.png';

/**
 * Bootstrap card image for a `GameRecipe`, showing its output common item's photo.
 *
 * @description A recipe has no photo of its own: the list item wrapper passes its output's
 *   `photo_path` as `url`. When the output is masked (`null`) or has no photo, falls back to the
 *   common-item placeholder, exactly like `CardCommonItemImage` — no dedicated recipe artwork.
 * @param {object} props - Component props.
 * @param {string|null} [props.url] - Output photo URL, or null/undefined to use the placeholder.
 * @param {string} props.alt - Alt text for the image.
 * @returns {React.ReactElement} Image element.
 */
export default function CardRecipeImage({ url, alt }) {
  return (
    <div className="card-photo-square">
      <img src={url || defaultCommonItemPhoto} className="card-img-top" alt={alt} />
    </div>
  );
}
