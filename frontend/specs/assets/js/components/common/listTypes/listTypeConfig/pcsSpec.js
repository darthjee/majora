import listTypeConfig from '../../../../../../../assets/js/components/common/listTypes/listTypeConfig.js';
import PcListItem from '../../../../../../../assets/js/components/common/listTypes/PcListItem.js';

describe('listTypeConfig', function() {
  describe('pcs', function() {
    const { pcs } = listTypeConfig;

    it('uses PcListItem as the wrapper class', function() {
      expect(pcs.wrapperClass).toBe(PcListItem);
    });

    it('has no filters component', function() {
      expect(pcs.filtersComponent).toBeNull();
    });

    it('uses the avatar photo type', function() {
      expect(pcs.photoType).toBe('avatar');
    });

    it('shows the caption text under the photo', function() {
      expect(pcs.showCaption).toBe(true);
    });

    describe('.buildItemHref', function() {
      it('links to the pc detail page', function() {
        const item = new PcListItem({ id: 1, name: 'Aragorn' });

        expect(pcs.buildItemHref(item, { gameSlug: 'demo' })).toBe('#/games/demo/pcs/1');
      });
    });

    describe('.buildActionBarProps', function() {
      it('is always non-manageable', function() {
        const item = new PcListItem({ id: 1, name: 'Aragorn' });

        expect(pcs.buildActionBarProps(item, { gameSlug: 'demo', canEdit: true })).toEqual({
          canEdit: false, secondaryButtons: [],
        });
      });
    });

    describe('.buildInfoBarItems', function() {
      it('returns an empty array for a plain PC', function() {
        const item = new PcListItem({ id: 1, name: 'Aragorn', is_pc: true });

        expect(pcs.buildInfoBarItems(item)).toEqual([]);
      });
    });

    describe('.fetchList', function() {
      it('fetches the game pcs endpoint with no permission check', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [{ id: 1, name: 'Aragorn' }],
          pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        const result = await pcs.fetchList('demo', undefined, client);

        expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/pcs.json');
        expect(result.data).toEqual([{ id: 1, name: 'Aragorn' }]);
        expect(result.canEdit).toBe(false);
      });

      it('defaults to an empty array when the response data is not an array', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: null, pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        const result = await pcs.fetchList('demo', undefined, client);

        expect(result.data).toEqual([]);
      });
    });
  });
});
