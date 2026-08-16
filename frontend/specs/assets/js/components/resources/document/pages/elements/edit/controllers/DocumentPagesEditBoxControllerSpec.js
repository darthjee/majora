import DocumentPagesEditBoxController
  from '../../../../../../../../../../assets/js/components/resources/document/pages/elements/edit/controllers/DocumentPagesEditBoxController.js';
import RequestStore from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import RequestPermissionResolvers
  from '../../../../../../../../../../assets/js/utils/requests/RequestPermissionResolvers.js';
import PagesSplitter from '../../../../../../../../../../assets/js/utils/PagesSplitter.js';

describe('DocumentPagesEditBoxController', function() {
  let ensureSpy;
  let mutateSpy;
  let resolveSpy;

  beforeEach(function() {
    ensureSpy = spyOn(RequestStore, 'ensure');
    mutateSpy = spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({ ok: true }));
    resolveSpy = spyOn(RequestPermissionResolvers, 'resolve').and.returnValue(Promise.resolve({ can_edit: false }));
  });

  describe('#loadAllPages', function() {
    it('fetches every page with a large per_page value, sorted by order, concatenated', async function() {
      ensureSpy.and.returnValue(Promise.resolve({
        data: [
          { id: 2, content: 'Second.', order: 2, version: 1 },
          { id: 1, content: 'First.', order: 1, version: 1 },
        ],
      }));
      const controller = new DocumentPagesEditBoxController('demo', 9);

      const { pages, content } = await controller.loadAllPages();

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'DocumentPagesEditBoxController',
        resource: 'gameDocumentPage',
        quantityType: 'collection',
        params: { gameSlug: 'demo', id: 9 },
        query: { page: 1, per_page: 10000 },
      });
      expect(pages.map((page) => page.id)).toEqual([1, 2]);
      expect(content).toBe('First.Second.');
    });

    it('degrades to an empty pages/content when the response data is not an array', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: null }));
      const controller = new DocumentPagesEditBoxController('demo', 9);

      const { pages, content } = await controller.loadAllPages();

      expect(pages).toEqual([]);
      expect(content).toBe('');
    });
  });

  describe('#save', function() {
    it('no-ops immediately without touching the network when not in edit mode', async function() {
      const controller = new DocumentPagesEditBoxController('demo', 9);

      const result = await controller.save('some content', false);

      expect(result).toEqual({ ok: true });
      expect(ensureSpy).not.toHaveBeenCalled();
      expect(mutateSpy).not.toHaveBeenCalled();
    });

    it('creates pages at version 1 for a fresh document with no existing pages, then trims and bumps', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: [] }));
      spyOn(PagesSplitter, 'split').and.returnValue(['Page one.', 'Page two.']);
      mutateSpy.and.callFake(({ method, body }) => {
        if (method === 'POST') {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: body.order === 1 ? 201 : 202 }) });
        }

        return Promise.resolve({ ok: true });
      });
      const controller = new DocumentPagesEditBoxController('demo', 9);

      const result = await controller.save('Page one.Page two.', true);

      expect(result).toEqual({ ok: true });
      expect(mutateSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        method: 'POST', quantityType: 'collection', body: { content: 'Page one.', order: 1, version: 1 },
      }));
      expect(mutateSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        method: 'POST', quantityType: 'collection', body: { content: 'Page two.', order: 2, version: 1 },
      }));
      expect(mutateSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        method: 'DELETE', quantityType: 'collection', body: { keep: 2 },
      }));
      expect(mutateSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        method: 'PATCH', quantityType: 'bumpVersion', body: { version: 1, exclude_ids: [201, 202] },
      }));
    });

    it('updates only changed pages, trims extras, and bumps the version of untouched survivors', async function() {
      ensureSpy.and.returnValue(Promise.resolve({
        data: [
          { id: 1, content: 'A', order: 1, version: 3 },
          { id: 2, content: 'B', order: 2, version: 3 },
          { id: 3, content: 'C', order: 3, version: 3 },
        ],
      }));
      spyOn(PagesSplitter, 'split').and.returnValue(['A', 'X']);
      const controller = new DocumentPagesEditBoxController('demo', 9);

      const result = await controller.save('AX', true);

      expect(result).toEqual({ ok: true });
      expect(mutateSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug: 'demo', id: 9, pageId: 2 },
        body: { content: 'X', version: 4 },
      }));
      expect(mutateSpy).not.toHaveBeenCalledWith(jasmine.objectContaining({
        params: jasmine.objectContaining({ pageId: 1 }),
      }));
      expect(mutateSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        method: 'DELETE', quantityType: 'collection', body: { keep: 2 },
      }));
      expect(mutateSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        method: 'PATCH', quantityType: 'bumpVersion', body: { version: 4, exclude_ids: [2] },
      }));
    });

    it('short-circuits the saga (skipping trim/bumpVersion) when a page save fails', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: [] }));
      spyOn(PagesSplitter, 'split').and.returnValue(['Page one.']);
      mutateSpy.and.returnValue(Promise.resolve({ ok: false }));
      const controller = new DocumentPagesEditBoxController('demo', 9);

      const result = await controller.save('Page one.', true);

      expect(result).toEqual({ ok: false });
      expect(mutateSpy).toHaveBeenCalledTimes(1);
    });

    it('resolves permissions once per save through RequestPermissionResolvers', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: [] }));
      spyOn(PagesSplitter, 'split').and.returnValue([]);
      const controller = new DocumentPagesEditBoxController('demo', 9);

      await controller.save('', true);

      expect(resolveSpy).toHaveBeenCalledWith('gameDocumentPage', 'collection', { gameSlug: 'demo', id: 9 });
    });

    it('uses the private variant when the resolved permissions allow can_edit', async function() {
      resolveSpy.and.returnValue(Promise.resolve({ can_edit: true }));
      ensureSpy.and.returnValue(Promise.resolve({ data: [] }));
      spyOn(PagesSplitter, 'split').and.returnValue([]);
      const controller = new DocumentPagesEditBoxController('demo', 9);

      await controller.save('', true);

      expect(mutateSpy).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'private' }));
    });

    it('uses the regular variant when the resolved permissions do not allow can_edit', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: [] }));
      spyOn(PagesSplitter, 'split').and.returnValue([]);
      const controller = new DocumentPagesEditBoxController('demo', 9);

      await controller.save('', true);

      expect(mutateSpy).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'regular' }));
    });

    it('falls back to the regular variant when the permission resolution rejects', async function() {
      resolveSpy.and.returnValue(Promise.reject(new Error('nope')));
      ensureSpy.and.returnValue(Promise.resolve({ data: [] }));
      spyOn(PagesSplitter, 'split').and.returnValue([]);
      const controller = new DocumentPagesEditBoxController('demo', 9);

      await controller.save('', true);

      expect(mutateSpy).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'regular' }));
    });
  });
});
