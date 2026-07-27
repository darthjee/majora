import HashRouteResolver from '../../../../../assets/js/utils/routing/HashRouteResolver.js';

describe('HashRouteResolver (game document photos/files routes, issue #873)', function() {
  it('resolves /games/:game_slug/documents/:id/photos to gameDocumentPhotos, not gameDocument', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/documents/5/photos').getPage()).toBe('gameDocumentPhotos');
  });

  it('resolves /games/:game_slug/documents/:id/files to gameDocumentFiles, not gameDocument', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/documents/5/files').getPage()).toBe('gameDocumentFiles');
  });
});
