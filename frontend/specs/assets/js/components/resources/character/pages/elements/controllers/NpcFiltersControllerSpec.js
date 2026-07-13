import NpcFiltersController
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/controllers/NpcFiltersController.js';

describe('NpcFiltersController', function() {
  describe('.slainToStatus', function() {
    it('maps "true" to "slain"', function() {
      expect(NpcFiltersController.slainToStatus('true')).toBe('slain');
    });

    it('maps "false" to "alive"', function() {
      expect(NpcFiltersController.slainToStatus('false')).toBe('alive');
    });

    it('maps null to blank', function() {
      expect(NpcFiltersController.slainToStatus(null)).toBe('');
    });

    it('maps any other value to blank', function() {
      expect(NpcFiltersController.slainToStatus('other')).toBe('');
    });
  });

  describe('.statusToSlain', function() {
    it('maps "alive" to "false"', function() {
      expect(NpcFiltersController.statusToSlain('alive')).toBe('false');
    });

    it('maps "slain" to "true"', function() {
      expect(NpcFiltersController.statusToSlain('slain')).toBe('true');
    });

    it('maps blank to blank', function() {
      expect(NpcFiltersController.statusToSlain('')).toBe('');
    });
  });

  describe('#handleStatusChange', function() {
    it('sets the draft status', function() {
      const setStatus = jasmine.createSpy('setStatus');
      const controller = new NpcFiltersController(setStatus, jasmine.createSpy('setName'));

      controller.handleStatusChange('slain');

      expect(setStatus).toHaveBeenCalledWith('slain');
    });
  });

  describe('#handleNameChange', function() {
    it('sets the draft name', function() {
      const setName = jasmine.createSpy('setName');
      const controller = new NpcFiltersController(jasmine.createSpy('setStatus'), setName);

      controller.handleNameChange('gob');

      expect(setName).toHaveBeenCalledWith('gob');
    });
  });

  describe('#handleAllegianceChange', function() {
    it('sets the draft allegiance', function() {
      const setAllegiance = jasmine.createSpy('setAllegiance');
      const controller = new NpcFiltersController(
        jasmine.createSpy('setStatus'), jasmine.createSpy('setName'), setAllegiance,
      );

      controller.handleAllegianceChange('ally');

      expect(setAllegiance).toHaveBeenCalledWith('ally');
    });
  });

  describe('#buildQuery', function() {
    const controller = new NpcFiltersController(jasmine.createSpy(), jasmine.createSpy(), jasmine.createSpy());

    it('omits all fields when blank', function() {
      expect(controller.buildQuery('', '', '')).toEqual({});
    });

    it('includes slain when status is not blank', function() {
      expect(controller.buildQuery('alive', '', '')).toEqual({ slain: 'false' });
      expect(controller.buildQuery('slain', '', '')).toEqual({ slain: 'true' });
    });

    it('includes name when non-blank, trimmed', function() {
      expect(controller.buildQuery('', '  gob  ', '')).toEqual({ name: 'gob' });
    });

    it('omits name when only whitespace', function() {
      expect(controller.buildQuery('', '   ', '')).toEqual({});
    });

    it('includes allegiance when non-blank', function() {
      expect(controller.buildQuery('', '', 'ally')).toEqual({ allegiance: 'ally' });
    });

    it('includes all fields when set', function() {
      expect(controller.buildQuery('slain', 'gob', 'enemy')).toEqual({
        slain: 'true', name: 'gob', allegiance: 'enemy',
      });
    });
  });

  describe('#clear', function() {
    it('resets all draft fields to blank', function() {
      const setStatus = jasmine.createSpy('setStatus');
      const setName = jasmine.createSpy('setName');
      const setAllegiance = jasmine.createSpy('setAllegiance');
      const controller = new NpcFiltersController(setStatus, setName, setAllegiance);

      controller.clear();

      expect(setStatus).toHaveBeenCalledWith('');
      expect(setName).toHaveBeenCalledWith('');
      expect(setAllegiance).toHaveBeenCalledWith('');
    });
  });
});
