import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import Pagination from '../../../../common/pagination/Pagination.jsx';
import Table from '../../../../common/misc/Table.jsx';
import Translator from '../../../../../i18n/Translator.js';
import StaffPhotoTabs from '../elements/StaffPhotoTabs.jsx';
import StaffPhotoThumbnail from '../elements/StaffPhotoThumbnail.jsx';
import StaffPhotoStatus from '../elements/StaffPhotoStatus.jsx';
import StaffPhotoOwner from '../elements/StaffPhotoOwner.jsx';
import StaffPhotoRowActions from '../elements/StaffPhotoRowActions.jsx';

const PREFIX = 'staff_photos_page';

/**
 * Rendering helper for the staff photos page.
 */
export default class StaffPhotosHelper {
  /**
   * Render the staff photos page: title, type tabs, action error, photo table (or empty state)
   * and pagination.
   *
   * @param {object} state - Page state.
   * @param {string[]} state.types - Available photo type slugs.
   * @param {string|null} state.photoType - Active photo type slug.
   * @param {object[]} state.photos - Photo rows of the active type.
   * @param {{page: number, pages: number, perPage: number}} state.pagination - Pagination.
   * @param {string|null} state.actionError - i18n key of the last row action error.
   * @param {object} state.versions - Map of photo id to cache-busting version.
   * @param {{onReplace: Function, onDelete: Function}} handlers - Row action handlers.
   * @returns {React.ReactElement} Staff photos page content.
   */
  static render(state, handlers) {
    const { types, photoType, pagination } = state;

    return (
      <div className="container mt-4">
        <PageActions backHref="#/" />
        <h1>{Translator.t(`${PREFIX}.title`)}</h1>
        <StaffPhotoTabs types={types} activeType={photoType} />
        {StaffPhotosHelper.#renderActionError(state.actionError)}
        {StaffPhotosHelper.#renderList(state, handlers)}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          perPage={pagination.perPage}
          basePath="#/staff/photos"
          extraParams={{ type: photoType }}
        />
      </div>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t(`${PREFIX}.loading`)} />;
  }

  /**
   * Render the load error state.
   *
   * @param {string} errorKey - i18n key of the error message.
   * @returns {React.ReactElement} Error alert.
   */
  static renderError(errorKey) {
    return <ErrorAlert error={Translator.t(errorKey)} />;
  }

  /**
   * Render the row action error alert, when there is one.
   *
   * @param {string|null} actionError - i18n key of the action error.
   * @returns {React.ReactElement|null} Error alert, or `null`.
   */
  static #renderActionError(actionError) {
    if (!actionError) return null;

    return <ErrorAlert error={Translator.t(actionError)} />;
  }

  /**
   * Render the photo table, or the empty state when there are no photos.
   *
   * @param {object} state - Page state.
   * @param {object[]} state.photos - Photo rows of the active type.
   * @param {object} state.versions - Map of photo id to cache-busting version.
   * @param {{onReplace: Function, onDelete: Function}} handlers - Row action handlers.
   * @returns {React.ReactElement} Photo table or empty message.
   */
  static #renderList({ photos, versions }, handlers) {
    if (photos.length === 0) return <p className="text-muted">{Translator.t(`${PREFIX}.empty`)}</p>;

    const columns = ['thumbnail', 'status', 'owner', 'actions'].map((key) => (
      { key, label: Translator.t(`${PREFIX}.${key}_column`) }
    ));
    const rows = photos.map((photo) => StaffPhotosHelper.#buildRow(photo, versions, handlers));

    return <Table columns={columns} rows={rows} />;
  }

  /**
   * Build a table row for a photo.
   *
   * @param {object} photo - The photo row.
   * @param {object} versions - Map of photo id to cache-busting version.
   * @param {{onReplace: Function, onDelete: Function}} handlers - Row action handlers.
   * @returns {object} Table row keyed by column.
   */
  static #buildRow(photo, versions, { onReplace, onDelete }) {
    return {
      id: photo.id,
      thumbnail: <StaffPhotoThumbnail photo={photo} versions={versions} />,
      status: <StaffPhotoStatus photo={photo} />,
      owner: <StaffPhotoOwner owner={photo.owner} />,
      actions: <StaffPhotoRowActions photo={photo} onReplace={onReplace} onDelete={onDelete} />,
    };
  }
}
