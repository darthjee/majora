import Translator from '../../../../../../i18n/Translator.js';
import Icons from '../../../../../../utils/ui/Icons.js';

/**
 * Rendering helper for {@link StaffPhotoThumbnail}.
 */
export default class StaffPhotoThumbnailHelper {
  /**
   * Render the thumbnail image, or the broken-image placeholder.
   *
   * @param {string|null} src - Image src, `null` when the photo has no path.
   * @param {boolean} broken - Whether the image already failed to load.
   * @param {Function} onError - Image `onError` handler.
   * @returns {React.ReactElement} Thumbnail image or placeholder.
   */
  static render(src, broken, onError) {
    if (!src || broken) return StaffPhotoThumbnailHelper.#renderPlaceholder();

    return (
      <img
        src={src}
        alt={Translator.t('staff_photos_page.thumbnail_alt')}
        className="img-thumbnail"
        style={{ maxWidth: '96px', maxHeight: '96px' }}
        loading="lazy"
        onError={onError}
      />
    );
  }

  /**
   * Render the broken-image placeholder.
   *
   * @returns {React.ReactElement} Placeholder icon with an accessible label.
   */
  static #renderPlaceholder() {
    const label = Translator.t('staff_photos_page.broken_image_alt');

    return (
      <i className={`bi ${Icons.image} fs-2 text-secondary`} role="img" aria-label={label} title={label} />
    );
  }
}
