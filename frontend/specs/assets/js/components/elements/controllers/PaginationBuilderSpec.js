import PaginationBuilder from '../../../../../../assets/js/components/elements/controllers/PaginationBuilder.js';

describe('PaginationBuilder', function() {
  describe('#build', function() {
    it('returns an empty list when totalPages is 0', function() {
      expect(new PaginationBuilder(1, 0).build()).toEqual([]);
    });

    it('returns a single page for a one-page set', function() {
      expect(
        new PaginationBuilder(1, 1).addFirstPages().addLastPages().addCurrentPageWindow().build()
      ).toEqual([1]);
    });

    it('includes first 3 pages', function() {
      const pages = new PaginationBuilder(1, 20).addFirstPages().build();
      expect(pages).toContain(1);
      expect(pages).toContain(2);
      expect(pages).toContain(3);
    });

    it('includes last 3 pages', function() {
      const pages = new PaginationBuilder(1, 20).addLastPages().build();
      expect(pages).toContain(18);
      expect(pages).toContain(19);
      expect(pages).toContain(20);
    });

    it('includes ±3 window around current page', function() {
      const pages = new PaginationBuilder(10, 20).addCurrentPageWindow().build();
      [7, 8, 9, 10, 11, 12, 13].forEach((p) => expect(pages).toContain(p));
    });

    it('inserts null gap markers between non-consecutive pages', function() {
      const pages = new PaginationBuilder(10, 20)
        .addFirstPages()
        .addLastPages()
        .addCurrentPageWindow()
        .build();
      expect(pages).toContain(null);
    });

    it('does not insert a gap between consecutive page groups', function() {
      const pages = new PaginationBuilder(4, 10)
        .addFirstPages()
        .addCurrentPageWindow()
        .build();
      expect(pages).not.toContain(null);
    });

    it('does not add pages below 1 or above totalPages', function() {
      const pages = new PaginationBuilder(1, 5).addCurrentPageWindow().build();
      pages.filter((p) => p !== null).forEach((p) => {
        expect(p).toBeGreaterThanOrEqual(1);
        expect(p).toBeLessThanOrEqual(5);
      });
    });
  });
});
