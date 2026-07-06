/**
 * @description Builds fresh spies shared by every StaffUsersController spec file.
 * @returns {object} the setters and client spies used to construct the controller.
 */
export function buildContext() {
  return {
    setUsers: jasmine.createSpy('setUsers'),
    setPagination: jasmine.createSpy('setPagination'),
    setLoading: jasmine.createSpy('setLoading'),
    setError: jasmine.createSpy('setError'),
    client: jasmine.createSpyObj('client', ['fetchUsers', 'fetchRecoveryLink']),
    authClient: jasmine.createSpyObj('authClient', ['status']),
  };
}
