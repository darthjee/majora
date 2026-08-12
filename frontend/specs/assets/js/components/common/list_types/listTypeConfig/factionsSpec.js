import listTypeConfig from '../../../../../../../assets/js/components/common/list_types/listTypeConfig.js';
import GameFactionListItem from '../../../../../../../assets/js/components/common/list_types/GameFactionListItem.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildFaction } from '../../../../../../support/factories.js';

function fakeHashResolver() {
  return { getPaginationParams: () => new URLSearchParams() };
}

describe('listTypeConfig', function() {
  describe('factions', function() {
    const { factions } = listTypeConfig;

    it('uses GameFactionListItem as the wrapper class', function() {
      expect(factions.wrapperClass).toBe(GameFactionListItem);
    });

    it('has no filters component', function() {
      expect(factions.filtersComponent).toBeNull();
    });

    it('uses the faction photo type', function() {
      expect(factions.photoType).toBe('faction');
    });

    it('shows the caption text under the photo', function() {
      expect(factions.showCaption).toBe(true);
    });

    it('renders 6 items per row (the default)', function() {
      expect(factions.itemsPerRow).toBe(6);
    });

    describe('.buildItemHref', function() {
      it('links to the faction detail page (issue #812)', function() {
        const item = new GameFactionListItem(buildFaction({ id: 5 }));

        expect(factions.buildItemHref(item, { gameSlug: 'demo' })).toBe('#/games/demo/factions/5');
      });
    });

    describe('.buildActionBarProps', function() {
      it('is always non-manageable', function() {
        const item = new GameFactionListItem(buildFaction());

        expect(factions.buildActionBarProps(item, { gameSlug: 'demo', canEdit: true })).toEqual({
          canEdit: false, secondaryButtons: [],
        });
      });
    });

    describe('.buildInfoBarItems', function() {
      it('is always empty', function() {
        const item = new GameFactionListItem(buildFaction());

        expect(factions.buildInfoBarItems(item)).toEqual([]);
      });
    });

    describe('.fetchList', function() {
      afterEach(function() {
        RequestStore.reset();
      });

      it('fetches through RequestStore with the game-owned faction collection and resolves canEdit false',
        async function() {
          spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
            data: [buildFaction({ id: 5 })],
            pagination: { page: 1, pages: 1, perPage: 10 },
          }));

          const result = await factions.fetchList('demo', fakeHashResolver());

          expect(RequestStore.ensure).toHaveBeenCalledWith({
            componentName: 'ListPageController',
            resource: 'faction',
            quantityType: 'collection',
            params: { gameSlug: 'demo' },
            query: {},
          });
          expect(result.data).toEqual([buildFaction({ id: 5 })]);
          expect(result.canEdit).toBe(false);
        });

      it('defaults to an empty array when the response data is not an array', async function() {
        spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: null, pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        const result = await factions.fetchList('demo', fakeHashResolver());

        expect(result.data).toEqual([]);
      });
    });
  });
});
