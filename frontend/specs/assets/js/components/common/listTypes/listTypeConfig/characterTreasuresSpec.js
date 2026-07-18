import listTypeConfig from '../../../../../../../assets/js/components/common/listTypes/listTypeConfig.js';
import CharacterTreasureListItem from '../../../../../../../assets/js/components/common/listTypes/CharacterTreasureListItem.js';
import TreasureFilters from '../../../../../../../assets/js/components/resources/treasure/pages/elements/TreasureFilters.jsx';
import TreasureCardHelper from '../../../../../../../assets/js/components/common/helpers/TreasureCardHelper.jsx';
import HashRouteResolver from '../../../../../../../assets/js/utils/routing/HashRouteResolver.js';
import AccessStore from '../../../../../../../assets/js/utils/access/store/AccessStore.js';

function buildGameClient(gameType = 'dnd') {
  const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame']);

  gameClient.fetchGame.and.returnValue(Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ game_type: gameType }),
  }));

  return gameClient;
}

describe('listTypeConfig', function() {
  [
    ['pc-treasures', 'pcs', '#/games/demo/pcs/2/treasures'],
    ['npc-treasures', 'npcs', '#/games/demo/npcs/2/treasures'],
  ].forEach(([type, characterKind, hash]) => {
    describe(type, function() {
      const config = listTypeConfig[type];

      it('uses CharacterTreasureListItem as the wrapper class', function() {
        expect(config.wrapperClass).toBe(CharacterTreasureListItem);
      });

      it('uses TreasureFilters as the filters component', function() {
        expect(config.filtersComponent).toBe(TreasureFilters);
      });

      it('uses the treasure photo type', function() {
        expect(config.photoType).toBe('treasure');
      });

      it('shows the caption text under the photo', function() {
        expect(config.showCaption).toBe(true);
      });

      describe('.buildItemHref', function() {
        it('links to the underlying treasure\'s global detail page', function() {
          const item = new CharacterTreasureListItem({ id: 1, treasure_id: 11, name: 'Golden Crown' });

          expect(config.buildItemHref(item)).toBe('#/treasures/11');
        });
      });

      describe('.buildActionBarProps', function() {
        it('is always non-manageable, since exchange stays a page-level modal', function() {
          const item = new CharacterTreasureListItem({ id: 1, treasure_id: 11, name: 'Golden Crown' });

          expect(config.buildActionBarProps(item, { gameSlug: 'demo', canEdit: true })).toEqual({
            canEdit: false, secondaryButtons: [],
          });
        });
      });

      describe('.buildInfoBarItems', function() {
        it('delegates to TreasureCardHelper.buildInfoBarItems with the owned quantity', function() {
          const item = new CharacterTreasureListItem({
            id: 1, treasure_id: 11, name: 'Golden Crown', quantity: 3, hidden: true,
          });

          expect(config.buildInfoBarItems(item)).toEqual(TreasureCardHelper.buildInfoBarItems(item.data, 3));
        });
      });

      describe('.fetchList', function() {
        it('merges the character\'s own game_type onto every fetched entry', async function() {
          const client = jasmine.createSpyObj('client', ['fetchIndex']);
          const hashResolver = new HashRouteResolver(() => hash);

          client.fetchIndex.and.returnValue(Promise.resolve({
            data: [{ id: 1, treasure_id: 11, name: 'Golden Crown', quantity: 1, value: 500 }],
            pagination: { page: 1, pages: 1, perPage: 10 },
          }));
          spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

          const result = await config.fetchList('demo', hashResolver, client, buildGameClient('deadlands'));

          expect(result.data).toEqual([{
            id: 1, treasure_id: 11, name: 'Golden Crown', quantity: 1, value: 500, game_type: 'deadlands',
          }]);
        });

        it('defaults to an empty array when the response data is not an array', async function() {
          const client = jasmine.createSpyObj('client', ['fetchIndex']);
          const hashResolver = new HashRouteResolver(() => hash);

          client.fetchIndex.and.returnValue(Promise.resolve({
            data: null, pagination: { page: 1, pages: 1, perPage: 10 },
          }));
          spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

          const result = await config.fetchList('demo', hashResolver, client, buildGameClient());

          expect(result.data).toEqual([]);
        });

        it('defaults the merged game_type to dnd when the game fetch fails', async function() {
          const client = jasmine.createSpyObj('client', ['fetchIndex']);
          const hashResolver = new HashRouteResolver(() => hash);
          const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame']);

          gameClient.fetchGame.and.returnValue(Promise.resolve({ ok: false }));
          client.fetchIndex.and.returnValue(Promise.resolve({
            data: [{ id: 1, treasure_id: 11, name: 'Golden Crown', quantity: 1, value: 500 }],
            pagination: { page: 1, pages: 1, perPage: 10 },
          }));
          spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

          const result = await config.fetchList('demo', hashResolver, client, gameClient);

          expect(result.data[0].game_type).toBe('dnd');
        });

        it('passes the min_value/max_value/name filter params from the hash resolver', async function() {
          const client = jasmine.createSpyObj('client', ['fetchIndex']);
          const filterHash = `${hash}?min_value=10&max_value=100&name=sword`;
          const hashResolver = new HashRouteResolver(() => filterHash);

          client.fetchIndex.and.returnValue(Promise.resolve({
            data: [], pagination: { page: 1, pages: 1, perPage: 10 },
          }));
          spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

          await config.fetchList('demo', hashResolver, client, buildGameClient());

          const expectedPath = `/games/demo/${characterKind}/2/treasures.json`;
          expect(client.fetchIndex).toHaveBeenCalledWith(expectedPath, {
            min_value: '10', max_value: '100', name: 'sword',
          });
        });

        if (characterKind === 'pcs') {
          it('always fetches the plain treasures.json endpoint, regardless of game-level canEdit', async function() {
            const client = jasmine.createSpyObj('client', ['fetchIndex']);
            const hashResolver = new HashRouteResolver(() => hash);

            client.fetchIndex.and.returnValue(Promise.resolve({
              data: [], pagination: { page: 1, pages: 1, perPage: 10 },
            }));

            const result = await config.fetchList('demo', hashResolver, client, buildGameClient());

            expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/pcs/2/treasures.json', {});
            expect(result.canEdit).toBe(false);
          });
        } else {
          it('fetches the hidden-inclusive treasures/all.json endpoint when game-level canEdit is true', async function() {
            const client = jasmine.createSpyObj('client', ['fetchIndex']);
            const hashResolver = new HashRouteResolver(() => hash);

            client.fetchIndex.and.returnValue(Promise.resolve({
              data: [], pagination: { page: 1, pages: 1, perPage: 10 },
            }));
            spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

            const result = await config.fetchList('demo', hashResolver, client, buildGameClient());

            expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs/2/treasures/all.json', {});
            expect(result.canEdit).toBe(true);
          });

          it('falls back to treasures.json when the game-level permission check fails', async function() {
            const client = jasmine.createSpyObj('client', ['fetchIndex']);
            const hashResolver = new HashRouteResolver(() => hash);

            client.fetchIndex.and.returnValue(Promise.resolve({
              data: [], pagination: { page: 1, pages: 1, perPage: 10 },
            }));
            spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('nope')));

            const result = await config.fetchList('demo', hashResolver, client, buildGameClient());

            expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs/2/treasures.json', {});
            expect(result.canEdit).toBe(false);
          });
        }
      });
    });
  });
});
