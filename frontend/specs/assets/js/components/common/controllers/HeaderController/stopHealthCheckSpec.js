import HeaderController from '../../../../../../../assets/js/components/common/controllers/HeaderController.js';
import ActivityTracker from '../../../../../../../assets/js/utils/ActivityTracker.js';
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

  describe('#stopHealthCheck', function() {
    beforeEach(function() {
      jasmine.clock().install();
      spyOn(ActivityTracker, 'getLastActivity').and.returnValue(Date.now());
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });

    it('stops the interval so check() is no longer called', function() {
      const controller = new HeaderController(
        setLoggedIn, setShowModal, setTestEmailStatus,
        setIsSuperUser, setServerStatus, client, healthClient
      );

      controller.startHealthCheck(1000);
      jasmine.clock().tick(1000);
      controller.stopHealthCheck();
      jasmine.clock().tick(2000);

      expect(healthClient.check).toHaveBeenCalledTimes(1);
    });
  });
});
