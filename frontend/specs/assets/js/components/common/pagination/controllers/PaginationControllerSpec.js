import PaginationController from '../../../../../../../assets/js/components/common/pagination/controllers/PaginationController.js';

describe('PaginationController', function() {
  describe('#buildPageList', function() {
    it('returns an empty list when totalPages is 0', function() {
      expect(new PaginationController(1, 0).buildPageList()).toEqual([]);
    });

    it('returns a list with a single page when totalPages is 1', function() {
      expect(new PaginationController(1, 1).buildPageList()).toEqual([1]);
    });

    it('returns a full page list for a small page count', function() {
      expect(new PaginationController(1, 5).buildPageList()).toEqual([1, 2, 3, 4, 5]);
    });

    it('includes gap markers for large page counts', function() {
      const list = new PaginationController(10, 50).buildPageList();
      expect(list).toContain(null);
    });

    it('always includes the first and last pages', function() {
      const list = new PaginationController(10, 50).buildPageList();
      expect(list[0]).toBe(1);
      expect(list[list.length - 1]).toBe(50);
    });
  });
});
