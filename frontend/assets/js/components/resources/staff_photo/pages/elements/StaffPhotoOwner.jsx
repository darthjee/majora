import StaffPhotoOwnerHelper from './helpers/StaffPhotoOwnerHelper.jsx';

/**
 * Owner cell of a staff photo row.
 *
 * @description Links to the owner's page when the owner type has one, falls back to plain text
 *   otherwise, and shows the orphan label when the photo has no owner.
 * @param {object} props - Component props.
 * @param {object|null} props.owner - The photo's owner.
 * @returns {React.ReactElement} Owner cell content.
 */
export default function StaffPhotoOwner({ owner }) {
  return StaffPhotoOwnerHelper.render(owner);
}
