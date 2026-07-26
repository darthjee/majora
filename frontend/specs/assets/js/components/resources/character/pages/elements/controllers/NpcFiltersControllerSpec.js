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

    it('includes public_slain when status is not blank', function() {
      expect(controller.buildQuery('alive', '', '')).toEqual({ public_slain: 'false' });
      expect(controller.buildQuery('slain', '', '')).toEqual({ public_slain: 'true' });
    });

    it('includes name when non-blank, trimmed', function() {
      expect(controller.buildQuery('', '  gob  ', '')).toEqual({ name: 'gob' });
    });

    it('omits name when only whitespace', function() {
      expect(controller.buildQuery('', '   ', '')).toEqual({});
    });

    it('includes public_allegiance when non-blank', function() {
      expect(controller.buildQuery('', '', 'ally')).toEqual({ public_allegiance: 'ally' });
    });

    it('includes all public fields when set', function() {
      expect(controller.buildQuery('slain', 'gob', 'enemy')).toEqual({
        public_slain: 'true', name: 'gob', public_allegiance: 'enemy',
      });
    });

    it('includes private_slain/private_allegiance when the private draft fields are set', function() {
      expect(controller.buildQuery('', '', '', '', 'slain', 'ally')).toEqual({
        private_slain: 'true', private_allegiance: 'ally',
      });
    });

    it('includes every field when all are set', function() {
      expect(controller.buildQuery('slain', 'gob', 'enemy', 'shown', 'alive', 'ally')).toEqual({
        public_slain: 'true',
        name: 'gob',
        public_allegiance: 'enemy',
        hidden: 'false',
        private_slain: 'false',
        private_allegiance: 'ally',
      });
    });
  });

  describe('#handlePrivateStatusChange', function() {
    it('sets the draft private status', function() {
      const setPrivateStatus = jasmine.createSpy('setPrivateStatus');
      const controller = new NpcFiltersController(
        jasmine.createSpy('setStatus'), jasmine.createSpy('setName'), jasmine.createSpy('setAllegiance'),
        jasmine.createSpy('setHidden'), setPrivateStatus,
      );

      controller.handlePrivateStatusChange('slain');

      expect(setPrivateStatus).toHaveBeenCalledWith('slain');
    });
  });

  describe('#handlePrivateAllegianceChange', function() {
    it('sets the draft private allegiance', function() {
      const setPrivateAllegiance = jasmine.createSpy('setPrivateAllegiance');
      const controller = new NpcFiltersController(
        jasmine.createSpy('setStatus'), jasmine.createSpy('setName'), jasmine.createSpy('setAllegiance'),
        jasmine.createSpy('setHidden'), jasmine.createSpy('setPrivateStatus'), setPrivateAllegiance,
      );

      controller.handlePrivateAllegianceChange('ally');

      expect(setPrivateAllegiance).toHaveBeenCalledWith('ally');
    });
  });

  describe('#clear', function() {
    it('resets all draft fields to blank', function() {
      const setStatus = jasmine.createSpy('setStatus');
      const setName = jasmine.createSpy('setName');
      const setAllegiance = jasmine.createSpy('setAllegiance');
      const setHidden = jasmine.createSpy('setHidden');
      const setPrivateStatus = jasmine.createSpy('setPrivateStatus');
      const setPrivateAllegiance = jasmine.createSpy('setPrivateAllegiance');
      const controller = new NpcFiltersController(
        setStatus, setName, setAllegiance, setHidden, setPrivateStatus, setPrivateAllegiance,
      );

      controller.clear();

      expect(setStatus).toHaveBeenCalledWith('');
      expect(setName).toHaveBeenCalledWith('');
      expect(setAllegiance).toHaveBeenCalledWith('');
      expect(setHidden).toHaveBeenCalledWith('');
      expect(setPrivateStatus).toHaveBeenCalledWith('');
      expect(setPrivateAllegiance).toHaveBeenCalledWith('');
    });
  });

  describe('.hiddenToFilter', function() {
    it('maps "true" to "hidden"', function() {
      expect(NpcFiltersController.hiddenToFilter('true')).toBe('hidden');
    });

    it('maps "false" to "shown"', function() {
      expect(NpcFiltersController.hiddenToFilter('false')).toBe('shown');
    });

    it('maps null to blank', function() {
      expect(NpcFiltersController.hiddenToFilter(null)).toBe('');
    });

    it('maps any other value to blank', function() {
      expect(NpcFiltersController.hiddenToFilter('other')).toBe('');
    });
  });

  describe('.filterToHidden', function() {
    it('maps "shown" to "false"', function() {
      expect(NpcFiltersController.filterToHidden('shown')).toBe('false');
    });

    it('maps "hidden" to "true"', function() {
      expect(NpcFiltersController.filterToHidden('hidden')).toBe('true');
    });

    it('maps blank to blank', function() {
      expect(NpcFiltersController.filterToHidden('')).toBe('');
    });
  });

  describe('#handleHiddenChange', function() {
    it('sets the draft hidden filter', function() {
      const setHidden = jasmine.createSpy('setHidden');
      const controller = new NpcFiltersController(
        jasmine.createSpy('setStatus'), jasmine.createSpy('setName'), jasmine.createSpy('setAllegiance'), setHidden,
      );

      controller.handleHiddenChange('hidden');

      expect(setHidden).toHaveBeenCalledWith('hidden');
    });
  });

  describe('#buildQuery with hidden', function() {
    const controller = new NpcFiltersController(
      jasmine.createSpy(), jasmine.createSpy(), jasmine.createSpy(), jasmine.createSpy(),
    );

    it('omits hidden when blank', function() {
      expect(controller.buildQuery('', '', '', '')).toEqual({});
    });

    it('includes hidden when set', function() {
      expect(controller.buildQuery('', '', '', 'shown')).toEqual({ hidden: 'false' });
      expect(controller.buildQuery('', '', '', 'hidden')).toEqual({ hidden: 'true' });
    });
  });
});
