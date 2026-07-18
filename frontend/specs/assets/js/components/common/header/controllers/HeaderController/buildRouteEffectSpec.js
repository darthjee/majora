import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import HashRouteResolver from '../../../../../../../../assets/js/utils/routing/HashRouteResolver.js';
import { buildContext, buildHeaderController } from './support.js';

describe('HeaderController', function() {
  let setLoggedIn, setShowModal, setTestEmailStatus, setIsSuperUser, setServerStatus, client;

  const buildController = (overrides = {}) => buildHeaderController(
    { setLoggedIn, setShowModal, setTestEmailStatus, setIsSuperUser, setServerStatus, client }, overrides
  );

  beforeEach(function() {
    ({ setLoggedIn, setShowModal, setTestEmailStatus, setIsSuperUser, setServerStatus, client } = buildContext());
  });

  afterEach(function() {
    Translator.setLanguage('en');
  });

  describe('#buildRouteEffect', function() {
    it('subscribes to hashchange and pushes the resolved route into setRoute', function() {
      const setRoute = jasmine.createSpy('setRoute');
      const eventTarget = jasmine.createSpyObj('eventTarget', ['addEventListener', 'removeEventListener']);
      let hash = '#/games/campaign';
      const routeResolver = new HashRouteResolver(() => hash);
      const controller = buildController({ setRoute, routeResolver, eventTarget });
      controller.buildRouteEffect()();

      expect(eventTarget.addEventListener).toHaveBeenCalledWith('hashchange', jasmine.any(Function));
      const handler = eventTarget.addEventListener.calls.mostRecent().args[1];
      hash = '#/games/campaign/pcs/7';
      handler();

      expect(setRoute).toHaveBeenCalledWith({ page: 'pcCharacter', gameSlug: 'campaign', characterId: '7' });
    });

    it('unsubscribes from hashchange on cleanup', function() {
      const eventTarget = jasmine.createSpyObj('eventTarget', ['addEventListener', 'removeEventListener']);
      const routeResolver = { getPage: () => 'home', getParams: () => ({}) };
      const controller = buildController({ routeResolver, eventTarget });
      controller.buildRouteEffect()()();

      expect(eventTarget.removeEventListener).toHaveBeenCalledWith('hashchange', jasmine.any(Function));
    });
  });

});
