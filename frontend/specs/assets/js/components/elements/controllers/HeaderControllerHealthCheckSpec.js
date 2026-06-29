import HeaderController from '../../../../../../assets/js/components/elements/controllers/HeaderController.js';

describe('HeaderController', function() {
  let setLoggedIn;
  let setShowModal;
  let setTestEmailStatus;
  let client;
  let healthClient;

  beforeEach(function() {
    setLoggedIn = jasmine.createSpy('setLoggedIn');
    setShowModal = jasmine.createSpy('setShowModal');
    setTestEmailStatus = jasmine.createSpy('setTestEmailStatus');
    client = {
      status: jasmine.createSpy('status'),
      logout: jasmine.createSpy('logout'),
      sendTestEmail: jasmine.createSpy('sendTestEmail'),
      setLanguagePreference: jasmine.createSpy('setLanguagePreference'),
    };
    healthClient = {
      check: jasmine.createSpy('check').and.returnValue(Promise.resolve({ ok: true })),
    };
  });

  describe('#startHealthCheck', function() {
    beforeEach(function() {
      jasmine.clock().install();
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });

    it('calls healthClient.check() at the given interval', function() {
      const controller = new HeaderController(
        setLoggedIn, setShowModal, setTestEmailStatus, client, healthClient
      );

      controller.startHealthCheck(1000);
      jasmine.clock().tick(3000);

      expect(healthClient.check).toHaveBeenCalledTimes(3);
    });

    it('does not call healthClient.check() before the interval elapses', function() {
      const controller = new HeaderController(
        setLoggedIn, setShowModal, setTestEmailStatus, client, healthClient
      );

      controller.startHealthCheck(1000);
      jasmine.clock().tick(999);

      expect(healthClient.check).not.toHaveBeenCalled();
    });
  });

  describe('#stopHealthCheck', function() {
    beforeEach(function() {
      jasmine.clock().install();
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });

    it('stops the interval so check() is no longer called', function() {
      const controller = new HeaderController(
        setLoggedIn, setShowModal, setTestEmailStatus, client, healthClient
      );

      controller.startHealthCheck(1000);
      jasmine.clock().tick(1000);
      controller.stopHealthCheck();
      jasmine.clock().tick(2000);

      expect(healthClient.check).toHaveBeenCalledTimes(1);
    });
  });
});
