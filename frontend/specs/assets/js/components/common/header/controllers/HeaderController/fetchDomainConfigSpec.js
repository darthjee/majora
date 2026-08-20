import { buildContext, buildHeaderController } from './support.js';

describe('HeaderController', function() {
  let setLoggedIn, setShowModal, setTestEmailStatus, setIsSuperUser, client, domainClient, setDomainConfig, controller;

  const buildController = () => buildHeaderController(
    { setLoggedIn, setShowModal, setTestEmailStatus, setIsSuperUser, client },
    { domainClient, setDomainConfig }
  );

  beforeEach(function() {
    ({ setLoggedIn, setShowModal, setTestEmailStatus, setIsSuperUser, client } = buildContext());
    domainClient = { config: jasmine.createSpy('config') };
    setDomainConfig = jasmine.createSpy('setDomainConfig');
    controller = buildController();
  });

  describe('#fetchDomainConfig', function() {
    it('stores the resolved favicon/title/subTitle via setDomainConfig', async function() {
      domainClient.config.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ favicon: '/domain/foo.png', title: 'Custom', sub_title: 'Sub' }),
      }));

      await controller.fetchDomainConfig();

      expect(setDomainConfig).toHaveBeenCalledWith({ favicon: '/domain/foo.png', title: 'Custom', subTitle: 'Sub' });
    });

    it('defaults favicon to null when the response omits it', async function() {
      domainClient.config.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ favicon: null, title: 'Majora', sub_title: 'RPG' }),
      }));

      await controller.fetchDomainConfig();

      expect(setDomainConfig).toHaveBeenCalledWith({ favicon: null, title: 'Majora', subTitle: 'RPG' });
    });

    it('does nothing when the response is not ok', async function() {
      domainClient.config.and.returnValue(Promise.resolve({ ok: false }));

      await controller.fetchDomainConfig();

      expect(setDomainConfig).not.toHaveBeenCalled();
    });

    it('swallows unexpected errors', async function() {
      domainClient.config.and.returnValue(Promise.reject(new Error('network')));

      await expectAsync(controller.fetchDomainConfig()).toBeResolved();
      expect(setDomainConfig).not.toHaveBeenCalled();
    });
  });
});
