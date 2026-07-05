import HeaderController from '../../../../../../assets/js/components/elements/controllers/HeaderController.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';

describe('HeaderController staff flag', function() {
  let setLoggedIn;
  let setShowModal;
  let setTestEmailStatus;
  let setIsSuperUser;
  let setServerStatus;
  let setIsStaff;
  let client;

  beforeEach(function() {
    setLoggedIn = jasmine.createSpy('setLoggedIn');
    setShowModal = jasmine.createSpy('setShowModal');
    setTestEmailStatus = jasmine.createSpy('setTestEmailStatus');
    setIsSuperUser = jasmine.createSpy('setIsSuperUser');
    setServerStatus = jasmine.createSpy('setServerStatus');
    setIsStaff = jasmine.createSpy('setIsStaff');
    client = {
      status: jasmine.createSpy('status'),
      logout: jasmine.createSpy('logout'),
      sendTestEmail: jasmine.createSpy('sendTestEmail'),
      setLanguagePreference: jasmine.createSpy('setLanguagePreference'),
    };
  });

  const buildController = () => new HeaderController(
    setLoggedIn, setShowModal, setTestEmailStatus, setIsSuperUser, setServerStatus,
    client, undefined, setIsStaff,
  );

  describe('#checkStatus', function() {
    it('calls setIsStaff with the staff flag from the status response', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.status.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ logged_in: true, is_staff: true }),
      }));

      await buildController().checkStatus();

      expect(setIsStaff).toHaveBeenCalledWith(true);
    });

    it('calls setIsStaff with false when is_staff is absent', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.status.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ logged_in: false }),
      }));

      await buildController().checkStatus();

      expect(setIsStaff).toHaveBeenCalledWith(false);
    });
  });
});
