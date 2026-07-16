import HeaderRouteResolver from '../../../../../../assets/js/components/common/controllers/HeaderRouteResolver.js';

describe('HeaderRouteResolver', function() {
  const buildRouteResolver = (page, hash) => ({
    getPage: () => page,
    getParams: jasmine.createSpy('getParams'),
    currentHash: () => hash,
  });

  describe('.resolve', function() {
    it('returns just the page for routes without params', function() {
      const routeResolver = buildRouteResolver('home', '#/');

      expect(HeaderRouteResolver.resolve(routeResolver)).toEqual({ page: 'home' });
      expect(routeResolver.getParams).not.toHaveBeenCalled();
    });

    [
      { page: 'pcCharacter', pattern: '/games/:game_slug/pcs/:character_id', params: { game_slug: 'campaign', character_id: '7' }, characterId: '7' },
      { page: 'npcCharacter', pattern: '/games/:game_slug/npcs/:character_id', params: { game_slug: 'campaign', character_id: '9' }, characterId: '9' },
    ].forEach(({ page, pattern, params, characterId }) => {
      it(`returns the gameSlug/characterId for the ${page} route`, function() {
        const routeResolver = { getPage: () => page, getParams: jasmine.createSpy('getParams').and.returnValue(params) };

        expect(HeaderRouteResolver.resolve(routeResolver)).toEqual({ page, gameSlug: 'campaign', characterId });
        expect(routeResolver.getParams).toHaveBeenCalledWith(pattern);
      });
    });

    [
      { page: 'game', hash: '#/games/epic-quest' },
      { page: 'gameEdit', hash: '#/games/epic-quest/edit' },
      { page: 'gamePcs', hash: '#/games/epic-quest/pcs' },
      { page: 'gameNpcs', hash: '#/games/epic-quest/npcs' },
      { page: 'gameTreasures', hash: '#/games/epic-quest/treasures' },
      { page: 'gamePolls', hash: '#/games/epic-quest/polls' },
      { page: 'gamePoll', hash: '#/games/epic-quest/polls/3' },
      { page: 'gamePollNew', hash: '#/games/epic-quest/polls/new' },
      { page: 'gameSessions', hash: '#/games/epic-quest/sessions' },
      { page: 'gameSession', hash: '#/games/epic-quest/sessions/3' },
      { page: 'gameTasks', hash: '#/games/epic-quest/tasks' },
      { page: 'gamePhotos', hash: '#/games/epic-quest/photos' },
    ].forEach(({ page, hash }) => {
      it(`resolves the gameSlug for the ${page} route`, function() {
        const routeResolver = buildRouteResolver(page, hash);

        expect(HeaderRouteResolver.resolve(routeResolver)).toEqual({ page, gameSlug: 'epic-quest' });
        expect(routeResolver.getParams).not.toHaveBeenCalled();
      });
    });

    [
      { page: 'games', hash: '#/games' },
      { page: 'gameNew', hash: '#/games/new' },
    ].forEach(({ page, hash }) => {
      it(`does not resolve a gameSlug for the ${page} route`, function() {
        const routeResolver = buildRouteResolver(page, hash);

        expect(HeaderRouteResolver.resolve(routeResolver)).toEqual({ page });
      });
    });
  });
});
