import CommonItemPreviewCardHelper from './helpers/CommonItemPreviewCardHelper.jsx';

/**
 * Read-only grid-cell card showing a single common item's photo, styled like
 * `PossessionPreviewCard`, for use in preview sections. When `href` is given, the whole card
 * links to it (the common item's own detail page), matching `PossessionPreviewCard`'s behavior.
 *
 * @param {object} props - Component props.
 * @param {object} props.commonItem - `GameCommonItem` preview data object.
 * @param {number} props.commonItem.id - Common item id.
 * @param {string} props.commonItem.name - Common item name.
 * @param {string|null} [props.commonItem.photo_path] - Optional common item photo path.
 * @param {string} [props.href] - Optional hash href the whole card links to.
 * @returns {React.ReactElement} Common item preview card element.
 */
export default function CommonItemPreviewCard({ commonItem, href }) {
  return CommonItemPreviewCardHelper.render(commonItem, href);
}
