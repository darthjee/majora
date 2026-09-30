import RecipeFiltersController
  from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/controllers/RecipeFiltersController.js';

describe('RecipeFiltersController', function() {
  describe('.categoryFromParams', function() {
    it('returns a valid category', function() {
      expect(RecipeFiltersController.categoryFromParams(new URLSearchParams('category=potion'))).toBe('potion');
    });

    it('returns blank for an unknown category', function() {
      expect(RecipeFiltersController.categoryFromParams(new URLSearchParams('category=bogus'))).toBe('');
    });

    it('returns blank when absent', function() {
      expect(RecipeFiltersController.categoryFromParams(new URLSearchParams(''))).toBe('');
    });
  });

  describe('.buildQuery', function() {
    it('includes a valid category', function() {
      expect(RecipeFiltersController.buildQuery('gear')).toEqual({ category: 'gear' });
    });

    it('omits a blank category', function() {
      expect(RecipeFiltersController.buildQuery('')).toEqual({});
    });
  });

  describe('#handleCategoryChange', function() {
    it('stores the category and applies the query', function() {
      const setCategory = jasmine.createSpy('setCategory');
      const onQuery = jasmine.createSpy('onQuery');

      new RecipeFiltersController(setCategory, onQuery).handleCategoryChange('poison');

      expect(setCategory).toHaveBeenCalledWith('poison');
      expect(onQuery).toHaveBeenCalledWith({ category: 'poison' });
    });

    it('applies an empty query for "all"', function() {
      const onQuery = jasmine.createSpy('onQuery');

      new RecipeFiltersController(jasmine.createSpy('setCategory'), onQuery).handleCategoryChange('');

      expect(onQuery).toHaveBeenCalledWith({});
    });
  });
});
