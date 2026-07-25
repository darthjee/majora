import StaffUsersFiltersController
  from '../../../../../../../../../assets/js/components/resources/staff_user/pages/elements/controllers/StaffUsersFiltersController.js';

describe('StaffUsersFiltersController', function() {
  describe('#handleStatusChange', function() {
    it('sets the draft status', function() {
      const setStatus = jasmine.createSpy('setStatus');
      const controller = new StaffUsersFiltersController(setStatus, jasmine.createSpy());

      controller.handleStatusChange('pending');

      expect(setStatus).toHaveBeenCalledWith('pending');
    });
  });

  describe('#handleSearchChange', function() {
    it('sets the draft search', function() {
      const setSearch = jasmine.createSpy('setSearch');
      const controller = new StaffUsersFiltersController(jasmine.createSpy(), setSearch);

      controller.handleSearchChange('jane');

      expect(setSearch).toHaveBeenCalledWith('jane');
    });
  });

  describe('#buildQuery', function() {
    const controller = new StaffUsersFiltersController(jasmine.createSpy(), jasmine.createSpy());

    it('omits blank fields', function() {
      expect(controller.buildQuery('', '')).toEqual({});
    });

    it('includes status when not blank', function() {
      expect(controller.buildQuery('pending', '')).toEqual({ status: 'pending' });
    });

    it('includes a trimmed search when not blank', function() {
      expect(controller.buildQuery('', '  jane  ')).toEqual({ search: 'jane' });
    });

    it('includes both fields when set', function() {
      expect(controller.buildQuery('approved', 'jane')).toEqual({ status: 'approved', search: 'jane' });
    });
  });

  describe('#clear', function() {
    it('resets both draft fields to blank', function() {
      const setStatus = jasmine.createSpy('setStatus');
      const setSearch = jasmine.createSpy('setSearch');
      const controller = new StaffUsersFiltersController(setStatus, setSearch);

      controller.clear();

      expect(setStatus).toHaveBeenCalledWith('');
      expect(setSearch).toHaveBeenCalledWith('');
    });
  });
});
