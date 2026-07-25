import StaffUsersController from '../../../../../../../../../assets/js/components/resources/staff_user/pages/controllers/StaffUsersController.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildContext } from './support.js';

describe('StaffUsersController', function() {
  let setUsers;
  let setPagination;
  let setLoading;
  let setError;
  let mutateSpy;

  beforeEach(function() {
    ({ setUsers, setPagination, setLoading, setError } = buildContext());
    mutateSpy = spyOn(RequestStore, 'mutate');
  });

  describe('#handleDeny', function() {
    it('mutates the deny endpoint with the user id and patches the returned user, even for an approved user', async function() {
      const users = [{ id: 1, name: 'Jane', email: 'jane@example.com', status: 'approved' }];
      mutateSpy.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: 1, name: 'Jane', email: 'jane@example.com', status: 'denied',
        }),
      }));
      const setUsersSpy = jasmine.createSpy('setUsers');

      const controller = new StaffUsersController(setUsers, setPagination, setLoading, setError);
      await controller.handleDeny(1, users, setUsersSpy);

      expect(mutateSpy).toHaveBeenCalledWith({
        componentName: 'StaffUsersController',
        resource: 'staffUser',
        method: 'POST',
        quantityType: 'deny',
        body: { user_id: 1 },
      });
      expect(setUsersSpy).toHaveBeenCalledWith([
        {
          id: 1, name: 'Jane', email: 'jane@example.com', status: 'denied',
        },
      ]);
    });

    it('does not patch the users list when the response is not ok', async function() {
      const users = [{ id: 1, name: 'Jane', email: 'jane@example.com', status: 'pending' }];
      mutateSpy.and.returnValue(Promise.resolve({ ok: false }));
      const setUsersSpy = jasmine.createSpy('setUsers');

      const controller = new StaffUsersController(setUsers, setPagination, setLoading, setError);
      await controller.handleDeny(1, users, setUsersSpy);

      expect(setUsersSpy).not.toHaveBeenCalled();
    });

    it('does not throw when the request rejects', async function() {
      const users = [{ id: 1, name: 'Jane', email: 'jane@example.com', status: 'pending' }];
      mutateSpy.and.returnValue(Promise.reject(new Error('network error')));
      const setUsersSpy = jasmine.createSpy('setUsers');

      const controller = new StaffUsersController(setUsers, setPagination, setLoading, setError);
      await controller.handleDeny(1, users, setUsersSpy);

      expect(setUsersSpy).not.toHaveBeenCalled();
    });
  });
});
