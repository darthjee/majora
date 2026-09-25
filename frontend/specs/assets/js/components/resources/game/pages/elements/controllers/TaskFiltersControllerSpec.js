import TaskFiltersController
  from '../../../../../../../../../assets/js/components/resources/game/pages/elements/controllers/TaskFiltersController.js';

describe('TaskFiltersController', function() {
  describe('.initialFilters', function() {
    it('keeps a known category and completed value', function() {
      const params = new URLSearchParams('category=painting&completed=true');

      expect(TaskFiltersController.initialFilters(params)).toEqual({ category: 'painting', completed: 'true' });
    });

    it('returns blank values when the params are absent', function() {
      expect(TaskFiltersController.initialFilters(new URLSearchParams(''))).toEqual({
        category: '', completed: '',
      });
    });

    it('returns blank values for unknown category and completed values', function() {
      const params = new URLSearchParams('category=dancing&completed=TRUE');

      expect(TaskFiltersController.initialFilters(params)).toEqual({ category: '', completed: '' });
    });
  });

  describe('#handleCategoryChange', function() {
    it('sets the draft category', function() {
      const setCategory = jasmine.createSpy('setCategory');
      const controller = new TaskFiltersController(setCategory, jasmine.createSpy());

      controller.handleCategoryChange('painting');

      expect(setCategory).toHaveBeenCalledWith('painting');
    });
  });

  describe('#handleCompletedChange', function() {
    it('sets the draft completed value', function() {
      const setCompleted = jasmine.createSpy('setCompleted');
      const controller = new TaskFiltersController(jasmine.createSpy(), setCompleted);

      controller.handleCompletedChange('false');

      expect(setCompleted).toHaveBeenCalledWith('false');
    });
  });

  describe('#buildQuery', function() {
    const controller = new TaskFiltersController(jasmine.createSpy(), jasmine.createSpy());

    it('omits both fields when blank', function() {
      expect(controller.buildQuery('', '')).toEqual({});
    });

    it('omits a blank category', function() {
      expect(controller.buildQuery('', 'true')).toEqual({ completed: 'true' });
    });

    it('omits a blank completed value', function() {
      expect(controller.buildQuery('painting', '')).toEqual({ category: 'painting' });
    });

    it('includes both fields when set', function() {
      expect(controller.buildQuery('painting', 'false')).toEqual({ category: 'painting', completed: 'false' });
    });
  });

  describe('#clear', function() {
    it('resets both draft fields to blank', function() {
      const setCategory = jasmine.createSpy('setCategory');
      const setCompleted = jasmine.createSpy('setCompleted');
      const controller = new TaskFiltersController(setCategory, setCompleted);

      controller.clear();

      expect(setCategory).toHaveBeenCalledWith('');
      expect(setCompleted).toHaveBeenCalledWith('');
    });
  });
});
