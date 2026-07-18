import listTypeConfig from '../../../../../../../assets/js/components/common/list_types/listTypeConfig.js';
import NpcListItem from '../../../../../../../assets/js/components/common/list_types/NpcListItem.js';
import NpcFilters from '../../../../../../../assets/js/components/resources/character/pages/elements/NpcFilters.jsx';
import AccessStore from '../../../../../../../assets/js/utils/access/store/AccessStore.js';
import HashRouteResolver from '../../../../../../../assets/js/utils/routing/HashRouteResolver.js';

describe('listTypeConfig', function() {
  describe('npcs', function() {
    const { npcs } = listTypeConfig;

    it('uses NpcListItem as the wrapper class', function() {
      expect(npcs.wrapperClass).toBe(NpcListItem);
    });

    it('uses NpcFilters as the filters component', function() {
      expect(npcs.filtersComponent).toBe(NpcFilters);
    });

    it('uses the avatar photo type', function() {
      expect(npcs.photoType).toBe('avatar');
    });

    it('shows the caption text under the photo', function() {
      expect(npcs.showCaption).toBe(true);
    });

    it('renders 4 items per row', function() {
      expect(npcs.itemsPerRow).toBe(4);
    });

    describe('.buildItemHref', function() {
      it('links to the npc detail page', function() {
        const item = new NpcListItem({ id: 1, name: 'Goblin' });

        expect(npcs.buildItemHref(item, { gameSlug: 'demo' })).toBe('#/games/demo/npcs/1');
      });
    });

    describe('.buildCardClassName', function() {
      it('returns the allegiance border class', function() {
        const item = new NpcListItem({ id: 1, name: 'Goblin', allegiance: 'enemy' });

        expect(npcs.buildCardClassName(item)).toBe('border border-danger');
      });

      it('defaults to the neutral border class when allegiance is absent', function() {
        const item = new NpcListItem({ id: 1, name: 'Goblin' });

        expect(npcs.buildCardClassName(item)).toBe('border border-secondary');
      });
    });

    describe('.buildInfoBarItems', function() {
      it('delegates to InfoBarRules.build', function() {
        const item = new NpcListItem({ id: 1, name: 'Goblin', slain: true, public_slain: false });

        expect(npcs.buildInfoBarItems(item).length).toBeGreaterThan(0);
      });
    });

    describe('.buildActionBarProps', function() {
      const character = { id: 1, name: 'Goblin', slain: true, public_slain: false, hidden: true };
      const item = new NpcListItem(character);

      it('grants upload access to an editor', function() {
        const onUploadClick = jasmine.createSpy('onUploadClick');
        const props = npcs.buildActionBarProps(item, { canEdit: true, onUploadClick });

        expect(props.canEdit).toBe(true);
        props.onClick();
        expect(onUploadClick).toHaveBeenCalledWith(character);
      });

      it('grants upload access to a player even without edit rights', function() {
        const props = npcs.buildActionBarProps(item, { canEdit: false, isPlayer: true });

        expect(props.canEdit).toBe(true);
      });

      it('denies upload access to a non-editor, non-player', function() {
        const props = npcs.buildActionBarProps(item, { canEdit: false, isPlayer: false });

        expect(props.canEdit).toBe(false);
      });

      it('renders grayscale when slain and dimmed when hidden', function() {
        const props = npcs.buildActionBarProps(item, { canEdit: false });

        expect(props.grayscale).toBe(true);
        expect(props.dimmed).toBe(true);
      });

      it('builds the DM real/public slain secondary buttons when canEdit is true', function() {
        const onSlainClick = jasmine.createSpy('onSlainClick');
        const onPublicSlainClick = jasmine.createSpy('onPublicSlainClick');
        const props = npcs.buildActionBarProps(item, { canEdit: true, onSlainClick, onPublicSlainClick });

        expect(props.secondaryButtons.length).toBe(2);
        props.secondaryButtons[0].onClick();
        props.secondaryButtons[1].onClick();
        expect(onSlainClick).toHaveBeenCalledWith(character);
        expect(onPublicSlainClick).toHaveBeenCalledWith(character);
      });

      it('builds the single player-facing slain button when isPlayer is true and canEdit is false', function() {
        const onPlayerSlainClick = jasmine.createSpy('onPlayerSlainClick');
        const props = npcs.buildActionBarProps(item, { canEdit: false, isPlayer: true, onPlayerSlainClick });

        expect(props.secondaryButtons.length).toBe(1);
        props.secondaryButtons[0].onClick();
        expect(onPlayerSlainClick).toHaveBeenCalledWith(character);
      });

      it('builds no secondary buttons for a non-editor, non-player', function() {
        const props = npcs.buildActionBarProps(item, { canEdit: false, isPlayer: false });

        expect(props.secondaryButtons).toEqual([]);
      });
    });

    describe('.fetchList', function() {
      it('fetches the player-facing endpoint when the requester cannot edit', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const hashResolver = new HashRouteResolver(() => '#/games/demo/npcs');

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [{ id: 1, name: 'Goblin' }],
          pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

        const result = await npcs.fetchList('demo', hashResolver, client);

        expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs.json', {});
        expect(result.data).toEqual([{ id: 1, name: 'Goblin' }]);
        expect(result.canEdit).toBe(false);
      });

      it('fetches the admin endpoint when the requester can edit', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const hashResolver = new HashRouteResolver(() => '#/games/demo/npcs');

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [], pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

        const result = await npcs.fetchList('demo', hashResolver, client);

        expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs/all.json', {});
        expect(result.canEdit).toBe(true);
      });

      it('passes the filter params from the hash resolver', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const hashResolver = new HashRouteResolver(() => '#/games/demo/npcs?slain=true&name=gob&allegiance=enemy&hidden=false');

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [], pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

        await npcs.fetchList('demo', hashResolver, client);

        expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs.json', {
          slain: 'true', name: 'gob', allegiance: 'enemy', hidden: 'false',
        });
      });

      it('defaults to the player-facing endpoint when the permission check fails', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const hashResolver = new HashRouteResolver(() => '#/games/demo/npcs');

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [], pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('nope')));

        const result = await npcs.fetchList('demo', hashResolver, client);

        expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs.json', {});
        expect(result.canEdit).toBe(false);
      });

      it('defaults to an empty array when the response data is not an array', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const hashResolver = new HashRouteResolver(() => '#/games/demo/npcs');

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: null, pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

        const result = await npcs.fetchList('demo', hashResolver, client);

        expect(result.data).toEqual([]);
      });
    });
  });
});
