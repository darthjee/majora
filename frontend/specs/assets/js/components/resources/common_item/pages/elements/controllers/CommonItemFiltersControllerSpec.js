import CommonItemFiltersController
  from '../../../../../../../../../assets/js/components/resources/common_item/pages/elements/controllers/CommonItemFiltersController.js';

describe('CommonItemFiltersController', function() {
  const setters = () => ({
    name: jasmine.createSpy('setName'),
    category: jasmine.createSpy('setCategory'),
    min: jasmine.createSpy('setMinPrice'),
    max: jasmine.createSpy('setMaxPrice'),
  });
  const build = (s) => new CommonItemFiltersController(s.name, s.category, s.min, s.max);

  describe('change handlers', function() {
    it('forward each value to its setter', function() {
      const s = setters();
      const controller = build(s);

      controller.handleNameChange('rope');
      controller.handleCategoryChange('tool');
      controller.handleMinPriceChange('1');
      controller.handleMaxPriceChange('9');

      expect(s.name).toHaveBeenCalledWith('rope');
      expect(s.category).toHaveBeenCalledWith('tool');
      expect(s.min).toHaveBeenCalledWith('1');
      expect(s.max).toHaveBeenCalledWith('9');
    });
  });

  describe('#buildQuery', function() {
    const controller = build(setters());

    it('omits all blank fields, including the "all" category', function() {
      expect(controller.buildQuery('', '', '', '')).toEqual({});
    });

    it('trims the name', function() {
      expect(controller.buildQuery('  rope  ', '', '', '')).toEqual({ name: 'rope' });
    });

    it('omits a whitespace-only name', function() {
      expect(controller.buildQuery('   ', '', '', '')).toEqual({});
    });

    it('keeps a 0 price', function() {
      expect(controller.buildQuery('', '', '0', '0')).toEqual({ min_price: '0', max_price: '0' });
    });

    it('includes all fields when set', function() {
      expect(controller.buildQuery('rope', 'tool', '1', '9')).toEqual({
        name: 'rope', category: 'tool', min_price: '1', max_price: '9',
      });
    });
  });

  describe('#clear', function() {
    it('resets all draft fields to blank', function() {
      const s = setters();

      build(s).clear();

      expect(s.name).toHaveBeenCalledWith('');
      expect(s.category).toHaveBeenCalledWith('');
      expect(s.min).toHaveBeenCalledWith('');
      expect(s.max).toHaveBeenCalledWith('');
    });
  });
});
