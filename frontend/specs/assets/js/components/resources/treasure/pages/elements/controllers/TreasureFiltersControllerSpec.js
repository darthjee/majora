import TreasureFiltersController
  from '../../../../../../../../../assets/js/components/resources/treasure/pages/elements/controllers/TreasureFiltersController.js';

describe('TreasureFiltersController', function() {
  describe('#handleGameTypeChange', function() {
    it('sets the draft game type', function() {
      const setGameType = jasmine.createSpy('setGameType');
      const controller = new TreasureFiltersController(setGameType, jasmine.createSpy(), jasmine.createSpy(), jasmine.createSpy());

      controller.handleGameTypeChange('dnd');

      expect(setGameType).toHaveBeenCalledWith('dnd');
    });
  });

  describe('#handleMinValueChange', function() {
    it('sets the draft min value', function() {
      const setMinValue = jasmine.createSpy('setMinValue');
      const controller = new TreasureFiltersController(jasmine.createSpy(), setMinValue, jasmine.createSpy(), jasmine.createSpy());

      controller.handleMinValueChange('10');

      expect(setMinValue).toHaveBeenCalledWith('10');
    });
  });

  describe('#handleMaxValueChange', function() {
    it('sets the draft max value', function() {
      const setMaxValue = jasmine.createSpy('setMaxValue');
      const controller = new TreasureFiltersController(jasmine.createSpy(), jasmine.createSpy(), setMaxValue, jasmine.createSpy());

      controller.handleMaxValueChange('100');

      expect(setMaxValue).toHaveBeenCalledWith('100');
    });
  });

  describe('#handleNameChange', function() {
    it('sets the draft name', function() {
      const setName = jasmine.createSpy('setName');
      const controller = new TreasureFiltersController(jasmine.createSpy(), jasmine.createSpy(), jasmine.createSpy(), setName);

      controller.handleNameChange('sword');

      expect(setName).toHaveBeenCalledWith('sword');
    });
  });

  describe('#buildQuery', function() {
    const controller = new TreasureFiltersController(
      jasmine.createSpy(), jasmine.createSpy(), jasmine.createSpy(), jasmine.createSpy(),
    );

    it('omits all fields when blank', function() {
      expect(controller.buildQuery('', '', '', '')).toEqual({});
    });

    it('includes game type when non-blank', function() {
      expect(controller.buildQuery('dnd', '', '', '')).toEqual({ game_type: 'dnd' });
    });

    it('includes min value when non-blank', function() {
      expect(controller.buildQuery('', '10', '', '')).toEqual({ min_value: '10' });
    });

    it('includes max value when non-blank', function() {
      expect(controller.buildQuery('', '', '100', '')).toEqual({ max_value: '100' });
    });

    it('includes name when non-blank, trimmed', function() {
      expect(controller.buildQuery('', '', '', '  sword  ')).toEqual({ name: 'sword' });
    });

    it('omits name when only whitespace', function() {
      expect(controller.buildQuery('', '', '', '   ')).toEqual({});
    });

    it('includes all fields when set', function() {
      expect(controller.buildQuery('dnd', '10', '100', 'sword')).toEqual({
        game_type: 'dnd', min_value: '10', max_value: '100', name: 'sword',
      });
    });
  });

  describe('#clear', function() {
    it('resets all draft fields to blank', function() {
      const setGameType = jasmine.createSpy('setGameType');
      const setMinValue = jasmine.createSpy('setMinValue');
      const setMaxValue = jasmine.createSpy('setMaxValue');
      const setName = jasmine.createSpy('setName');
      const controller = new TreasureFiltersController(setGameType, setMinValue, setMaxValue, setName);

      controller.clear();

      expect(setGameType).toHaveBeenCalledWith('');
      expect(setMinValue).toHaveBeenCalledWith('');
      expect(setMaxValue).toHaveBeenCalledWith('');
      expect(setName).toHaveBeenCalledWith('');
    });
  });
});
