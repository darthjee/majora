import RequestStore from '../../../../../../../utils/requests/RequestStore.js';
import RequestPermissionResolvers from '../../../../../../../utils/requests/RequestPermissionResolvers.js';
import PagesSplitter from '../../../../../../../utils/PagesSplitter.js';

const ALL_PAGES_PER_PAGE = 10000;

/**
 * Manages the `DocumentPagesEditBox` element's data (issue #1129): fetching a `GameDocument`'s
 * entire current content (all pages concatenated, plus its shared `version`) when entering pages
 * edit mode, and running the save saga described in the issue's "Save saga request shape"/"Page
 * versioning & history" sections when `save()` is called while in edit mode.
 *
 * @description The save saga's target version is always `(current shared document version) + 1`
 *   (freshly-created-document pages start at `1`, since an empty page set resolves a current
 *   version of `0`) — sent explicitly on every request the saga makes, per the shared contract
 *   (`plan.md`). Each `save()` call re-fetches the document's current live page set as its very
 *   first step (rather than reusing whatever was loaded when edit mode was entered), so a retry
 *   after a partial failure naturally re-derives its diff from wherever the previous attempt left
 *   things — no separate partial-resume bookkeeping needed. Permissions are resolved once per
 *   `save()` call (via `RequestPermissionResolvers.resolve('gameDocumentPage', 'collection', ...)`,
 *   the exact same check `GET.collection`'s own `private` variant already uses) and the resulting
 *   `variantName` is then passed explicitly to every mutation in that save, rather than letting
 *   each individual `RequestStore.mutate` call re-resolve permissions on its own (issue
 *   #1129, following the documented `variantName` convention in `docs/agents/issue-enhancement.md`).
 */
export default class DocumentPagesEditBoxController {
  /**
   * Create a DocumentPagesEditBoxController.
   *
   * @param {string} gameSlug - Game slug the document belongs to.
   * @param {number|string} id - `GameDocument` id.
   */
  constructor(gameSlug, id) {
    this.gameSlug = gameSlug;
    this.id = id;
  }

  /**
   * Fetch every page currently belonging to the document (not paginated — a large `per_page`
   * value is used since the backend paginator has no upper cap), sorted by `order`.
   *
   * @returns {Promise<{pages: object[], content: string}>} Resolves to the sorted pages plus
   *   their contents concatenated back into a single blob (seeding the edit textarea).
   */
  loadAllPages() {
    return RequestStore.ensure({
      componentName: 'DocumentPagesEditBoxController',
      resource: 'gameDocumentPage',
      quantityType: 'collection',
      params: { gameSlug: this.gameSlug, id: this.id },
      query: { page: 1, per_page: ALL_PAGES_PER_PAGE },
    }).then(({ data }) => {
      const pages = DocumentPagesEditBoxController.#sortPages(Array.isArray(data) ? data : []);

      return { pages, content: pages.map((page) => page.content).join('') };
    });
  }

  /**
   * The pages component's single save entry point. No-ops immediately when `editMode` is false
   * (the document-level save handler calls this unconditionally — see the issue's "Save
   * orchestration" section). Otherwise runs the full create/update/trim/bump-version saga against
   * `value` (the textarea's current content), split into pages via {@link PagesSplitter}.
   *
   * @param {string} value - Current textarea content.
   * @param {boolean} editMode - Whether pages edit mode is currently active.
   * @returns {Promise<{ok: boolean}>} Resolves to whether the saga (or the no-op) succeeded.
   */
  save(value, editMode) {
    if (!editMode) {
      return Promise.resolve({ ok: true });
    }

    return this.#resolveVariantName()
      .then((variantName) => this.loadAllPages()
        .then(({ pages }) => this.#runSaga(value, pages, variantName)));
  }

  #resolveVariantName() {
    return RequestPermissionResolvers.resolve('gameDocumentPage', 'collection', {
      gameSlug: this.gameSlug, id: this.id,
    })
      .then((permissions) => (permissions.can_edit ? 'private' : 'regular'))
      .catch(() => 'regular');
  }

  #runSaga(value, pages, variantName) {
    const nextContents = PagesSplitter.split(value);
    const version = DocumentPagesEditBoxController.#currentVersion(pages) + 1;
    const touchedIds = [];

    return this.#saveEachPage(nextContents, pages, version, variantName, touchedIds)
      .then((allOk) => (allOk ? this.#trim(nextContents.length, variantName) : false))
      .then((trimOk) => (trimOk ? this.#bumpVersion(version, touchedIds, variantName) : false))
      .then((ok) => ({ ok }));
  }

  #saveEachPage(nextContents, pages, version, variantName, touchedIds) {
    const tasks = nextContents.map((content, index) => this.#savePage(
      content, index, pages[index], version, variantName, touchedIds,
    ));

    return Promise.all(tasks).then((results) => results.every(Boolean));
  }

  #savePage(content, index, existing, version, variantName, touchedIds) {
    if (existing && existing.content === content) {
      return Promise.resolve(true);
    }

    if (existing) {
      touchedIds.push(existing.id);
      return this.#update(existing.id, content, version, variantName);
    }

    return this.#create(content, index + 1, version, variantName, touchedIds);
  }

  #create(content, order, version, variantName, touchedIds) {
    return RequestStore.mutate({
      componentName: 'DocumentPagesEditBoxController',
      resource: 'gameDocumentPage',
      method: 'POST',
      quantityType: 'collection',
      params: { gameSlug: this.gameSlug, id: this.id },
      body: { content, order, version },
      variantName,
    }).then((response) => DocumentPagesEditBoxController.#trackCreated(response, touchedIds));
  }

  #update(pageId, content, version, variantName) {
    return RequestStore.mutate({
      componentName: 'DocumentPagesEditBoxController',
      resource: 'gameDocumentPage',
      method: 'PATCH',
      quantityType: 'single',
      params: { gameSlug: this.gameSlug, id: this.id, pageId },
      body: { content, version },
      variantName,
    }).then((response) => response.ok);
  }

  #trim(keep, variantName) {
    return RequestStore.mutate({
      componentName: 'DocumentPagesEditBoxController',
      resource: 'gameDocumentPage',
      method: 'DELETE',
      quantityType: 'collection',
      params: { gameSlug: this.gameSlug, id: this.id },
      body: { keep },
      variantName,
    }).then((response) => response.ok);
  }

  #bumpVersion(version, excludeIds, variantName) {
    return RequestStore.mutate({
      componentName: 'DocumentPagesEditBoxController',
      resource: 'gameDocumentPage',
      method: 'PATCH',
      quantityType: 'bumpVersion',
      params: { gameSlug: this.gameSlug, id: this.id },
      body: { version, exclude_ids: excludeIds },
      variantName,
    }).then((response) => response.ok);
  }

  static #trackCreated(response, touchedIds) {
    if (!response.ok) {
      return false;
    }

    return response.json().then((data) => {
      if (data?.id !== undefined) touchedIds.push(data.id);
      return true;
    });
  }

  static #sortPages(pages) {
    return [...pages].sort((a, b) => a.order - b.order);
  }

  static #currentVersion(pages) {
    return pages[0]?.version ?? 0;
  }
}
