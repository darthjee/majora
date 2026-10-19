import { Page } from '../../src/core/Page.js';

describe('Page', () => {
  const response = (body, headers = {}) => ({ status: 200, headers: new Headers(headers), body });

  describe('fromResponse', () => {
    it('reads the pagination headers', () => {
      const page = Page.fromResponse(response([{ id: 1 }], { page: '2', pages: '7', per_page: '50', total: '330' }));

      expect(page.data).toEqual([{ id: 1 }]);
      expect(page.page).toEqual(2);
      expect(page.pages).toEqual(7);
      expect(page.perPage).toEqual(50);
      expect(page.total).toEqual(330);
    });

    it('makes a single page when the headers are missing', () => {
      const page = Page.fromResponse(response([{ id: 1 }, { id: 2 }]));

      expect(page.page).toEqual(1);
      expect(page.pages).toEqual(1);
      expect(page.perPage).toEqual(2);
      expect(page.total).toEqual(2);
      expect(page.hasNext).toBeFalse();
    });

    it('ignores invalid headers', () => {
      const page = Page.fromResponse(response([], { page: 'x', pages: '', total: 'many' }));

      expect(page.page).toEqual(1);
      expect(page.pages).toEqual(1);
      expect(page.total).toEqual(0);
    });

    it('uses an empty array for a non-array body', () => {
      expect(Page.fromResponse(response(null)).data).toEqual([]);
      expect(Page.fromResponse(response({ id: 1 })).data).toEqual([]);
    });
  });

  describe('hasNext and next', () => {
    it('fetches the next page on a middle page', async () => {
      const nextPage = new Page({ data: [], page: 3, pages: 3, perPage: 1, total: 3 });
      const fetchPage = jasmine.createSpy('fetchPage').and.resolveTo(nextPage);
      const page = new Page({ data: [{}], page: 2, pages: 3, perPage: 1, total: 3 }, fetchPage);

      expect(page.hasNext).toBeTrue();
      expect(await page.next()).toBe(nextPage);
      expect(fetchPage).toHaveBeenCalledOnceWith(3);
    });

    it('returns null on the last page without fetching', async () => {
      const fetchPage = jasmine.createSpy('fetchPage');
      const page = new Page({ data: [{}], page: 3, pages: 3, perPage: 1, total: 3 }, fetchPage);

      expect(page.hasNext).toBeFalse();
      expect(await page.next()).toBeNull();
      expect(fetchPage).not.toHaveBeenCalled();
    });

    it('returns null without a fetcher', async () => {
      expect(await new Page({ data: [], page: 1, pages: 2, perPage: 0, total: 0 }).next()).toBeNull();
    });
  });
});
