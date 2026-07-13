import StaffUsersController from '../../../../../../../../../assets/js/components/resources/staff_user/pages/controllers/StaffUsersController.js';
import { buildContext } from './support.js';

describe('StaffUsersController', function() {
  let setUsers;
  let setPagination;
  let setLoading;
  let setError;
  let client;

  beforeEach(function() {
    ({ setUsers, setPagination, setLoading, setError, client } = buildContext());
  });

  describe('#handleCopyRecoveryLink', function() {
    let originalDescriptor;

    beforeEach(function() {
      originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    });

    afterEach(function() {
      if (originalDescriptor) {
        Object.defineProperty(globalThis, 'navigator', originalDescriptor);
      }
    });

    const stubClipboard = (writeText) => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { clipboard: { writeText } },
        configurable: true,
      });
    };

    it('copies the url and marks the row as copied', async function() {
      const writeText = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
      stubClipboard(writeText);
      const setRecoveryLinks = jasmine.createSpy('setRecoveryLinks');

      const controller = new StaffUsersController(setUsers, setPagination, setLoading, setError, client);
      await controller.handleCopyRecoveryLink(1, 'http://example.com/recover', {}, setRecoveryLinks);

      expect(writeText).toHaveBeenCalledWith('http://example.com/recover');
      expect(setRecoveryLinks).toHaveBeenCalledWith({
        1: { status: 'copied', url: 'http://example.com/recover' },
      });
    });

    it('swallows clipboard errors', async function() {
      const writeText = jasmine.createSpy('writeText').and.returnValue(Promise.reject(new Error('denied')));
      stubClipboard(writeText);
      const setRecoveryLinks = jasmine.createSpy('setRecoveryLinks');

      const controller = new StaffUsersController(setUsers, setPagination, setLoading, setError, client);

      await expectAsync(
        controller.handleCopyRecoveryLink(1, 'http://example.com/recover', {}, setRecoveryLinks),
      ).toBeResolved();
      expect(setRecoveryLinks).not.toHaveBeenCalled();
    });
  });
});
