import Translator from '../../../../../../i18n/Translator.js';
import buildStaffPhotoOwnerLink from '../../helpers/StaffPhotoOwnerLink.js';

/**
 * Rendering helper for {@link StaffPhotoOwner}.
 */
export default class StaffPhotoOwnerHelper {
  /**
   * Render a photo's owner cell.
   *
   * @param {object|null} owner - The photo's owner, `null` for an orphan photo.
   * @returns {React.ReactElement} Owner link / text (with its game name), or the orphan label.
   */
  static render(owner) {
    if (!owner) {
      return <span className="text-muted fst-italic">{Translator.t('staff_photos_page.owner_orphan')}</span>;
    }

    return (
      <div>
        {StaffPhotoOwnerHelper.#renderName(buildStaffPhotoOwnerLink(owner))}
        {StaffPhotoOwnerHelper.#renderGame(owner)}
      </div>
    );
  }

  /**
   * Render the owner name, linked when an href is available.
   *
   * @param {{href: (string|null), text: string}} link - The owner link.
   * @returns {React.ReactElement} Owner link or plain text.
   */
  static #renderName({ href, text }) {
    if (!href) return <span>{text}</span>;

    return <a href={href}>{text}</a>;
  }

  /**
   * Render the owner's game name, skipped for game owners (the name already is the game).
   *
   * @param {object} owner - The photo's owner.
   * @returns {React.ReactElement|null} Game name line, or `null`.
   */
  static #renderGame(owner) {
    if (!owner.game || owner.type === 'game') return null;

    return <div className="small text-muted">{owner.game.name}</div>;
  }
}
