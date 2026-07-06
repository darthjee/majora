import StaffUsersController from '../../../../../../../assets/js/components/pages/controllers/StaffUsersController.js';
import { buildContext } from './support.js';

describe('StaffUsersController', function() {
  let setUsers;
  let setPagination;
  let setLoading;
  let setError;
  let client;
  let authClient;

  beforeEach(function() {
    ({ setUsers, setPagination, setLoading, setError, client, authClient } = buildContext());
  });

  describe('#handleGenerateRecoveryLink', function() {
    it('marks the row as loading, then ready with the returned url on success', async function() {
      client.fetchRecoveryLink.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ url: 'http://example.com/recover?token=abc' }),
      }));
      const setRecoveryLinks = jasmine.createSpy('setRecoveryLinks');

      const controller = new StaffUsersController(
        setUsers, setPagination, setLoading, setError, client, authClient,
      );
      await controller.handleGenerateRecoveryLink(1, {}, setRecoveryLinks);

      expect(setRecoveryLinks).toHaveBeenCalledWith({ 1: { status: 'loading', url: null } });
      expect(setRecoveryLinks).toHaveBeenCalledWith({
        1: { status: 'ready', url: 'http://example.com/recover?token=abc' },
      });
    });

    it('marks the row as error when the response is not ok', async function() {
      client.fetchRecoveryLink.and.returnValue(Promise.resolve({ ok: false }));
      const setRecoveryLinks = jasmine.createSpy('setRecoveryLinks');

      const controller = new StaffUsersController(
        setUsers, setPagination, setLoading, setError, client, authClient,
      );
      await controller.handleGenerateRecoveryLink(1, {}, setRecoveryLinks);

      expect(setRecoveryLinks).toHaveBeenCalledWith({ 1: { status: 'error', url: null } });
    });

    it('marks the row as error when the request throws', async function() {
      client.fetchRecoveryLink.and.returnValue(Promise.reject(new Error('network error')));
      const setRecoveryLinks = jasmine.createSpy('setRecoveryLinks');

      const controller = new StaffUsersController(
        setUsers, setPagination, setLoading, setError, client, authClient,
      );
      await controller.handleGenerateRecoveryLink(1, {}, setRecoveryLinks);

      expect(setRecoveryLinks).toHaveBeenCalledWith({ 1: { status: 'error', url: null } });
    });

    it('preserves other rows already in the recovery links map', async function() {
      client.fetchRecoveryLink.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ url: 'http://example.com/recover?token=abc' }),
      }));
      const setRecoveryLinks = jasmine.createSpy('setRecoveryLinks');
      const existing = { 2: { status: 'ready', url: 'http://example.com/other' } };

      const controller = new StaffUsersController(
        setUsers, setPagination, setLoading, setError, client, authClient,
      );
      await controller.handleGenerateRecoveryLink(1, existing, setRecoveryLinks);

      expect(setRecoveryLinks).toHaveBeenCalledWith({
        2: { status: 'ready', url: 'http://example.com/other' },
        1: { status: 'ready', url: 'http://example.com/recover?token=abc' },
      });
    });
  });
});
