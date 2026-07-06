import Translator from '../../../../../../../assets/js/i18n/Translator.js';
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
    it('returns just the page for routes without params', function() {
      const routeResolver = { getPage: () => 'home', getParams: jasmine.createSpy('getParams') };
      const controller = buildController({ routeResolver });

      expect(controller.getRoute()).toEqual({ page: 'home' });
      expect(routeResolver.getParams).not.toHaveBeenCalled();
    });

    [
      { page: 'game', pattern: '/games/:game_slug', params: { game_slug: 'campaign' }, characterId: undefined },
      { page: 'pcCharacter', pattern: '/games/:game_slug/pcs/:character_id', params: { game_slug: 'campaign', character_id: '7' }, characterId: '7' },
      { page: 'npcCharacter', pattern: '/games/:game_slug/npcs/:character_id', params: { game_slug: 'campaign', character_id: '9' }, characterId: '9' },
    ].forEach(({ page, pattern, params, characterId }) => {
      it(`returns the gameSlug/characterId for the ${page} route`, function() {
        const routeResolver = { getPage: () => page, getParams: jasmine.createSpy('getParams').and.returnValue(params) };
        const controller = buildController({ routeResolver });

        expect(controller.getRoute()).toEqual({ page, gameSlug: 'campaign', characterId });
        expect(routeResolver.getParams).toHaveBeenCalledWith(pattern);
      });
    });
  });

});
