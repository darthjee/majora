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
import StaffPhotoSelectCheckbox from '../elements/StaffPhotoSelectCheckbox.jsx';
import StaffPhotoBulkActions from '../elements/StaffPhotoBulkActions.jsx';
import { allSelected } from '../hooks/useStaffPhotoSelection.js';

const PREFIX = 'staff_photos_page';

/**
 * Rendering helper for the staff photos page.
 */
export default class StaffPhotosHelper {
  /**
   * Render the staff photos page: title, type tabs, action error / info, bulk action bar, photo
   * table (or empty state) and pagination.
   *
   * @param {object} state - Page state.
   * @param {string[]} state.types - Available photo type slugs.
   * @param {string|null} state.photoType - Active photo type slug.
   * @param {object[]} state.photos - Photo rows of the active type.
   * @param {{page: number, pages: number, perPage: number}} state.pagination - Pagination.
   * @param {string|null} state.actionError - i18n key of the last row action error.
   * @param {object} state.versions - Map of photo id to cache-busting version.
   * @param {string|null} state.actionInfo - i18n key of the last row action info message.
   * @param {number[]} state.selectedIds - Selected photo ids.
   * @param {object|null} state.bulkJob - Running bulk job, or `null`.
   * @param {{onResize: Function, onReplace: Function, onDelete: Function, onToggle: Function,
   *   onToggleAll: Function, onBulk: Function}} handlers - Row, selection and bulk handlers.
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
        {StaffPhotosHelper.#renderActionInfo(state.actionInfo)}
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
   * Render the row action info alert, when there is one.
   *
   * @param {string|null} actionInfo - i18n key of the info message.
   * @returns {React.ReactElement|null} Info alert, or `null`.
   */
  static #renderActionInfo(actionInfo) {
    if (!actionInfo) return null;

    return <div className="alert alert-info" role="status">{Translator.t(actionInfo)}</div>;
  }

  /**
   * Render the bulk action bar and photo table, or the empty state when there are no photos.
   *
   * @param {object} state - Page state.
   * @param {object[]} state.photos - Photo rows of the active type.
   * @param {number[]} state.selectedIds - Selected photo ids.
   * @param {object|null} state.bulkJob - Running bulk job, or `null`.
   * @param {object} handlers - Row, selection and bulk handlers.
   * @returns {React.ReactElement} Photo table or empty message.
   */
  static #renderList(state, handlers) {
    const { photos, selectedIds = [] } = state;

    if (photos.length === 0) return <p className="text-muted">{Translator.t(`${PREFIX}.empty`)}</p>;

    const running = Boolean(state.bulkJob);
    const columns = ['select', 'thumbnail', 'status', 'owner', 'actions'].map((key) => (
      { key, label: Translator.t(`${PREFIX}.${key}_column`) }
    ));
    const context = { ...state, selectedIds, running };
    const rows = photos.map((photo) => StaffPhotosHelper.#buildRow(photo, context, handlers));

    return (
      <>
        <StaffPhotoBulkActions
          count={selectedIds.length}
          allSelected={allSelected(selectedIds, photos)}
          running={running}
          onToggleAll={handlers.onToggleAll}
          onBulk={handlers.onBulk}
        />
        <Table columns={columns} rows={rows} />
      </>
    );
  }

  /**
   * Build a table row for a photo.
   *
   * @param {object} photo - The photo row.
   * @param {{versions: object, selectedIds: number[], running: boolean}} context - Versions
   *   map, selected ids and bulk running flag.
   * @param {object} handlers - Row and selection handlers.
   * @returns {object} Table row keyed by column.
   */
  static #buildRow(photo, { versions, selectedIds, running }, handlers) {
    const { onResize, onReplace, onDelete, onToggle } = handlers;

    return {
      id: photo.id,
      select: (
        <StaffPhotoSelectCheckbox
          photo={photo}
          checked={selectedIds.includes(photo.id)}
          disabled={running}
          onToggle={onToggle}
        />
      ),
      thumbnail: <StaffPhotoThumbnail photo={photo} versions={versions} />,
      status: <StaffPhotoStatus photo={photo} />,
      owner: <StaffPhotoOwner owner={photo.owner} />,
      actions: (
        <StaffPhotoRowActions
          photo={photo}
          disabled={running}
          onResize={onResize}
          onReplace={onReplace}
          onDelete={onDelete}
        />
      ),
    };
  }
}
