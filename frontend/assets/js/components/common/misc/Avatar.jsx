import defaultAvatar from '../../../../images/placeholders/default_avatar.png';

/**
 * Small round avatar image that falls back to a default placeholder when no URL is provided.
 *
 * @param {object} props - Component props.
 * @param {string|null} [props.url] - Avatar URL, or null/undefined to use the default photo.
 * @param {string} props.alt - Alt text for the image.
 * @returns {React.ReactElement} Image element.
 */
export default function Avatar({ url, alt }) {
  return (
    <img src={url || defaultAvatar} className="avatar-photo" alt={alt} />
  );
}
