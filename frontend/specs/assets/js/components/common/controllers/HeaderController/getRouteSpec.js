import Translator from '../../../../../../../assets/js/i18n/Translator.js';
import HeaderRouteResolver from '../../../../../../../assets/js/components/common/controllers/HeaderRouteResolver.js';
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

  describe('#getRoute', function() {
    it('delegates to HeaderRouteResolver with the injected route resolver', function() {
      const routeResolver = { getPage: () => 'home' };
      const resolved = { page: 'gamePolls', gameSlug: 'epic-quest' };
      spyOn(HeaderRouteResolver, 'resolve').and.returnValue(resolved);
      const controller = buildController({ routeResolver });

      expect(controller.getRoute()).toBe(resolved);
      expect(HeaderRouteResolver.resolve).toHaveBeenCalledWith(routeResolver);
    });
  });

});
