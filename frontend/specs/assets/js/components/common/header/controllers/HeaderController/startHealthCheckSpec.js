import HeaderController from '../../../../../../../../assets/js/components/common/header/controllers/HeaderController.js';
import ActivityTracker from '../../../../../../../../assets/js/utils/logging/ActivityTracker.js';
import { buildHealthCheckContext } from './support.js';

describe('HeaderController', function() {
  let setLoggedIn;
  let setShowModal;
  let setTestEmailStatus;
  let setIsSuperUser;
  let setServerStatus;
  let client;
  let healthClient;

  beforeEach(function() {
    ({
      setLoggedIn, setShowModal, setTestEmailStatus, setIsSuperUser, setServerStatus, client, healthClient,
    } = buildHealthCheckContext());
  });

  describe('#startHealthCheck', function() {
    beforeEach(function() {
      jasmine.clock().install();
      spyOn(ActivityTracker, 'getLastActivity').and.returnValue(Date.now());
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });

    it('calls healthClient.check() at the given interval', function() {
      const controller = new HeaderController(
        setLoggedIn, setShowModal, setTestEmailStatus,
        setIsSuperUser, setServerStatus, client, healthClient
      );

      controller.startHealthCheck(1000);
      jasmine.clock().tick(3000);

      expect(healthClient.check).toHaveBeenCalledTimes(3);
    });

    it('does not call healthClient.check() before the interval elapses', function() {
      const controller = new HeaderController(
        setLoggedIn, setShowModal, setTestEmailStatus,
        setIsSuperUser, setServerStatus, client, healthClient
      );

      controller.startHealthCheck(1000);
      jasmine.clock().tick(999);

      expect(healthClient.check).not.toHaveBeenCalled();
    });

    it('uses 60000 ms as the default polling interval', function() {
      const controller = new HeaderController(
        setLoggedIn, setShowModal, setTestEmailStatus,
        setIsSuperUser, setServerStatus, client, healthClient
      );

      controller.startHealthCheck();
      jasmine.clock().tick(59999);

      expect(healthClient.check).not.toHaveBeenCalled();

      jasmine.clock().tick(1);

      expect(healthClient.check).toHaveBeenCalledTimes(1);
    });

    it('calls setServerStatus("up") on a successful response', async function() {
      healthClient.check.and.returnValue(Promise.resolve({ ok: true, status: 200 }));

      const controller = new HeaderController(
        setLoggedIn, setShowModal, setTestEmailStatus,
        setIsSuperUser, setServerStatus, client, healthClient
      );

      controller.startHealthCheck(1000);
      jasmine.clock().tick(1000);

      await Promise.resolve();
      await Promise.resolve();

      expect(setServerStatus).toHaveBeenCalledWith('up');
    });

    it('calls setServerStatus("down") on a 502 response', async function() {
      healthClient.check.and.returnValue(Promise.resolve({ ok: false, status: 502 }));

      const controller = new HeaderController(
        setLoggedIn, setShowModal, setTestEmailStatus,
        setIsSuperUser, setServerStatus, client, healthClient
      );

      controller.startHealthCheck(1000);
      jasmine.clock().tick(1000);

      await Promise.resolve();
      await Promise.resolve();

      expect(setServerStatus).toHaveBeenCalledWith('down');
    });

    it('calls setServerStatus("down") on a network error', async function() {
      healthClient.check.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new HeaderController(
        setLoggedIn, setShowModal, setTestEmailStatus,
        setIsSuperUser, setServerStatus, client, healthClient
      );

      controller.startHealthCheck(1000);
      jasmine.clock().tick(1000);

      await Promise.resolve();
      await Promise.resolve();

      expect(setServerStatus).toHaveBeenCalledWith('down');
    });

    it('skips the health check when last activity was more than 30 minutes ago', function() {
      ActivityTracker.getLastActivity.and.returnValue(Date.now() - 31 * 60 * 1000);

      const controller = new HeaderController(
        setLoggedIn, setShowModal, setTestEmailStatus,
        setIsSuperUser, setServerStatus, client, healthClient
      );

      controller.startHealthCheck(1000);
      jasmine.clock().tick(1000);

      expect(healthClient.check).not.toHaveBeenCalled();
    });

    it('skips the health check when no activity has been registered', function() {
      ActivityTracker.getLastActivity.and.returnValue(null);

      const controller = new HeaderController(
        setLoggedIn, setShowModal, setTestEmailStatus,
        setIsSuperUser, setServerStatus, client, healthClient
      );

      controller.startHealthCheck(1000);
      jasmine.clock().tick(1000);

      expect(healthClient.check).not.toHaveBeenCalled();
    });

    it('does not skip the health check when activity was within 30 minutes', function() {
      ActivityTracker.getLastActivity.and.returnValue(Date.now() - 29 * 60 * 1000);

      const controller = new HeaderController(
        setLoggedIn, setShowModal, setTestEmailStatus,
        setIsSuperUser, setServerStatus, client, healthClient
      );

      controller.startHealthCheck(1000);
      jasmine.clock().tick(1000);

      expect(healthClient.check).toHaveBeenCalledTimes(1);
    });
  });
});
