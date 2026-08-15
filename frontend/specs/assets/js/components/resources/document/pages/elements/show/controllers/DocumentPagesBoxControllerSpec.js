import DocumentPagesBoxController
  from '../../../../../../../../../../assets/js/components/resources/document/pages/elements/show/controllers/DocumentPagesBoxController.js';
import RequestStore
  from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('DocumentPagesBoxController', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/documents/9' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  describe('#loadInitial', function() {
    it('fetches page 1 with per_page 1 when the hash has no page param', async function() {
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [{ id: 1, content: 'Page one.', order: 1 }],
        pagination: { page: 1, pages: 3, perPage: 1, total: 3 },
      }));
      const controller = new DocumentPagesBoxController('demo', 9);

      const state = await controller.loadInitial();

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'DocumentPagesBoxController',
        resource: 'gameDocumentPage',
        quantityType: 'collection',
        params: { gameSlug: 'demo', id: 9 },
        query: { page: 1, per_page: 1 },
      });
      expect(state).toEqual({
        segments: [{ id: 1, content: 'Page one.', order: 1 }],
        loadedPages: new Set([1]),
        totalPages: 3,
        currentPage: 1,
      });
    });

    it('fetches a per_page 4 window starting just before a deep-linked page', async function() {
      globalThis.window.location.hash = '#/games/demo/documents/9?page=5';
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [
          { id: 4, content: 'Page four.', order: 4 },
          { id: 5, content: 'Page five.', order: 5 },
          { id: 6, content: 'Page six.', order: 6 },
          { id: 7, content: 'Page seven.', order: 7 },
        ],
        pagination: { page: 4, pages: 10, perPage: 4, total: 40 },
      }));
      const controller = new DocumentPagesBoxController('demo', 9);

      const state = await controller.loadInitial();

      expect(ensureSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        query: { page: 4, per_page: 4 },
      }));
      expect(state.loadedPages).toEqual(new Set([4, 5, 6, 7]));
      expect(state.currentPage).toBe(5);
      expect(state.totalPages).toBe(10);
      expect(state.segments.map((segment) => segment.order)).toEqual([4, 5, 6, 7]);
    });

    it('clamps the window start to page 1 for a deep link just past the first page', async function() {
      globalThis.window.location.hash = '#/games/demo/documents/9?page=2';
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [{ id: 1, content: 'Page one.', order: 1 }, { id: 2, content: 'Page two.', order: 2 }],
        pagination: { page: 1, pages: 5, perPage: 4, total: 20 },
      }));
      const controller = new DocumentPagesBoxController('demo', 9);

      await controller.loadInitial();

      expect(ensureSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        query: { page: 1, per_page: 4 },
      }));
    });

    it('falls back to the first loaded segment as the current page when the requested page is missing', async function() {
      globalThis.window.location.hash = '#/games/demo/documents/9?page=5';
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [{ id: 1, content: 'Page one.', order: 1 }],
        pagination: { page: 1, pages: 1, perPage: 4, total: 1 },
      }));
      const controller = new DocumentPagesBoxController('demo', 9);

      const state = await controller.loadInitial();

      expect(state.currentPage).toBe(1);
    });

    it('degrades to an empty state when the fetch rejects', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('network error')));
      const controller = new DocumentPagesBoxController('demo', 9);

      const state = await controller.loadInitial();

      expect(state).toEqual({
        segments: [], loadedPages: new Set(), totalPages: 0, currentPage: 1,
      });
    });
  });

  describe('#loadNext', function() {
    const buildState = () => ({
      segments: [{ id: 1, content: 'Page one.', order: 1 }],
      loadedPages: new Set([1]),
      totalPages: 3,
      currentPage: 1,
    });

    it('fetches and appends the next not-yet-loaded page', async function() {
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [{ id: 2, content: 'Page two.', order: 2 }],
        pagination: { page: 2, pages: 3, perPage: 1, total: 3 },
      }));
      const controller = new DocumentPagesBoxController('demo', 9);

      const state = await controller.loadNext(buildState());

      expect(ensureSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        query: { page: 2, per_page: 1 },
      }));
      expect(state.segments.map((segment) => segment.order)).toEqual([1, 2]);
      expect(state.loadedPages).toEqual(new Set([1, 2]));
      expect(state.currentPage).toBe(1);
    });

    it('does not fetch (dedup) once every page up to totalPages is already tracked as loaded', async function() {
      const state = { ...buildState(), loadedPages: new Set([1, 2, 3]), totalPages: 3 };
      const ensureSpy = spyOn(RequestStore, 'ensure');
      const controller = new DocumentPagesBoxController('demo', 9);

      const result = await controller.loadNext(state);

      expect(ensureSpy).not.toHaveBeenCalled();
      expect(result).toBe(state);
    });

    it('skips already-loaded pages when computing the next page to fetch (non-contiguous loadedPages)',
      async function() {
        const state = { ...buildState(), loadedPages: new Set([1, 4]), totalPages: 5 };
        const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: [{ id: 5, content: 'Page five.', order: 5 }],
          pagination: { page: 5, pages: 5, perPage: 1, total: 5 },
        }));
        const controller = new DocumentPagesBoxController('demo', 9);

        await controller.loadNext(state);

        expect(ensureSpy).toHaveBeenCalledWith(jasmine.objectContaining({ query: { page: 5, per_page: 1 } }));
      });

    it('keeps the previous state unchanged when the fetch rejects (no blanking out loaded pages)',
      async function() {
        spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('network error')));
        const controller = new DocumentPagesBoxController('demo', 9);
        const state = buildState();

        const result = await controller.loadNext(state);

        expect(result).toBe(state);
      });
  });

  describe('.resolveMostVisiblePage', function() {
    it('returns the fallback when no entry is intersecting', function() {
      const entries = [{ isIntersecting: false, intersectionRatio: 0, target: { dataset: { page: '2' } } }];

      expect(DocumentPagesBoxController.resolveMostVisiblePage(entries, 1)).toBe(1);
    });

    it('returns the page of the most-intersecting entry', function() {
      const entries = [
        { isIntersecting: true, intersectionRatio: 0.2, target: { dataset: { page: '1' } } },
        { isIntersecting: true, intersectionRatio: 0.9, target: { dataset: { page: '2' } } },
        { isIntersecting: false, intersectionRatio: 1, target: { dataset: { page: '3' } } },
      ];

      expect(DocumentPagesBoxController.resolveMostVisiblePage(entries, 1)).toBe(2);
    });

    it('falls back when the winning entry has no parsable page', function() {
      const entries = [{ isIntersecting: true, intersectionRatio: 0.5, target: { dataset: {} } }];

      expect(DocumentPagesBoxController.resolveMostVisiblePage(entries, 4)).toBe(4);
    });
  });
});
