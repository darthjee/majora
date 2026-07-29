import HashRouteResolver from '../../../../../assets/js/utils/routing/HashRouteResolver.js';

/**
 * Pagination/filter/param-extraction specs for `HashRouteResolver`, split out of
 * `HashRouteResolverSpec.js` to keep that file under the project's max-lines limit, mirroring
 * how other large configs (e.g. `documentListTypes.js`) get split out of their parent file.
 */
describe('HashRouteResolver params', function() {
  it('extracts pagination params only', function() {
    const params = new HashRouteResolver(() => '#/games?page=2&foo=bar&per_page=12').getPaginationParams();
    expect(params.toString()).toBe('page=2&per_page=12');
  });

  it('extracts filter params only', function() {
    const params = new HashRouteResolver(
      () => '#/games/campaign/npcs?public_slain=true&private_slain=false&name=gob'
        + '&public_allegiance=ally&private_allegiance=enemy&page=2',
    ).getFilterParams();
    expect(params.toString()).toBe(
      'public_slain=true&private_slain=false&name=gob&public_allegiance=ally&private_allegiance=enemy',
    );
  });

  it('extracts the npc hidden filter param', function() {
    const params = new HashRouteResolver(
      () => '#/games/campaign/npcs?hidden=true&page=2',
    ).getFilterParams();
    expect(params.toString()).toBe('hidden=true');
  });

  it('ignores filter params when absent from the hash', function() {
    const params = new HashRouteResolver(() => '#/games/campaign/npcs?page=2').getFilterParams();
    expect(params.toString()).toBe('');
  });

  it('extracts the treasure filter params', function() {
    const params = new HashRouteResolver(
      () => '#/treasures?game_type=dnd&min_value=10&max_value=100&name=sword&page=2',
    ).getFilterParams();
    expect(params.toString()).toBe('name=sword&game_type=dnd&min_value=10&max_value=100');
  });

  it('extracts the staff users status and search filter params', function() {
    const params = new HashRouteResolver(
      () => '#/staff/users?status=pending&search=jane&page=2',
    ).getFilterParams();
    expect(params.toString()).toBe('status=pending&search=jane');
  });

  it('extracts the poll status filter param', function() {
    const params = new HashRouteResolver(() => '#/games/campaign/polls?status=open&page=2').getFilterParams();
    expect(params.toString()).toBe('status=open');
  });

  describe('#getParams', function() {
    it('extracts a single param for a matching path', function() {
      const resolver = new HashRouteResolver(() => '#/games/campaign');
      expect(resolver.getParams('/games/:game_slug')).toEqual({ game_slug: 'campaign' });
    });

    it('extracts multiple params for a matching path', function() {
      const resolver = new HashRouteResolver(() => '#/games/campaign/pcs/7');
      expect(resolver.getParams('/games/:game_slug/pcs/:character_id'))
        .toEqual({ game_slug: 'campaign', character_id: '7' });
    });

    it('ignores query params when extracting', function() {
      const resolver = new HashRouteResolver(() => '#/games/campaign?page=2');
      expect(resolver.getParams('/games/:game_slug')).toEqual({ game_slug: 'campaign' });
    });

    it('returns an empty object when the path does not match the pattern', function() {
      const resolver = new HashRouteResolver(() => '#/games/campaign/pcs/7');
      expect(resolver.getParams('/games/:game_slug')).toEqual({});
    });
  });
});
