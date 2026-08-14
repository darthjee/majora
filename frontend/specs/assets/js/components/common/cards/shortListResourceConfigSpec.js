import shortListResourceConfig
  from '../../../../../../assets/js/components/common/cards/shortListResourceConfig.js';
import CharacterPreviewCard from '../../../../../../assets/js/components/common/cards/CharacterPreviewCard.jsx';
import TreasurePreviewCard from '../../../../../../assets/js/components/common/cards/TreasurePreviewCard.jsx';
import ItemPreviewCard from '../../../../../../assets/js/components/common/cards/ItemPreviewCard.jsx';
import DocumentPreviewCard from '../../../../../../assets/js/components/common/cards/DocumentPreviewCard.jsx';
import PossessionPreviewCard from '../../../../../../assets/js/components/common/cards/PossessionPreviewCard.jsx';

describe('shortListResourceConfig', function() {
  describe('.pc', function() {
    const { pc } = shortListResourceConfig;

    it('builds fetch params from the game slug', function() {
      expect(pc.buildParams({ game_slug: 'demo' })).toEqual({ gameSlug: 'demo' });
    });

    it('builds the see-all href to the game\'s pcs page', function() {
      expect(pc.buildSeeAllHref({ game_slug: 'demo' })).toBe('#/games/demo/pcs');
    });

    it('navigates to the pc\'s own detail page', function() {
      expect(pc.action).toBe('navigate');
      expect(pc.buildHref({ game_slug: 'demo' }, { id: 5 })).toBe('#/games/demo/pcs/5');
    });

    it('renders a CharacterPreviewCard for the pc character type', function() {
      const item = { id: 5, name: 'Aragorn' };
      const element = pc.renderItem(item, { game_slug: 'demo' });

      expect(element.type).toBe(CharacterPreviewCard);
      expect(element.props).toEqual({ character: item, gameSlug: 'demo', characterType: 'pc' });
    });
  });

  describe('.npc', function() {
    const { npc } = shortListResourceConfig;

    it('builds fetch params from the game slug', function() {
      expect(npc.buildParams({ game_slug: 'demo' })).toEqual({ gameSlug: 'demo' });
    });

    it('builds the see-all href to the game\'s npcs page', function() {
      expect(npc.buildSeeAllHref({ game_slug: 'demo' })).toBe('#/games/demo/npcs');
    });

    it('navigates to the npc\'s own detail page', function() {
      expect(npc.action).toBe('navigate');
      expect(npc.buildHref({ game_slug: 'demo' }, { id: 8 })).toBe('#/games/demo/npcs/8');
    });

    it('renders a CharacterPreviewCard for the npc character type', function() {
      const item = { id: 8, name: 'Gandalf' };
      const element = npc.renderItem(item, { game_slug: 'demo' });

      expect(element.type).toBe(CharacterPreviewCard);
      expect(element.props).toEqual({ character: item, gameSlug: 'demo', characterType: 'npc' });
    });
  });

  describe('.treasure', function() {
    const { treasure } = shortListResourceConfig;
    const pcContext = { game_slug: 'demo', id: 7, is_pc: true };
    const npcContext = { game_slug: 'demo', id: 7, is_pc: false };

    it('builds fetch params scoped to the pc character', function() {
      expect(treasure.buildParams(pcContext)).toEqual({ gameSlug: 'demo', kind: 'pcs', id: 7 });
    });

    it('builds fetch params scoped to the npc character', function() {
      expect(treasure.buildParams(npcContext)).toEqual({ gameSlug: 'demo', kind: 'npcs', id: 7 });
    });

    it('builds the see-all href to the character\'s treasures page', function() {
      expect(treasure.buildSeeAllHref(pcContext)).toBe('#/games/demo/pcs/7/treasures');
    });

    it('navigates to the treasure\'s own detail page', function() {
      expect(treasure.action).toBe('navigate');
      expect(treasure.buildHref(pcContext, { treasure_id: 9 })).toBe('#/treasures/9');
    });

    it('renders a TreasurePreviewCard with the character\'s game_type', function() {
      const item = {
        id: 1, treasure_id: 9, name: 'Potion', value: 50, quantity: 2, photo_path: null,
      };
      const element = treasure.renderItem(item, { ...pcContext, game_type: 'deadlands' });

      expect(element.type).toBe(TreasurePreviewCard);
      expect(element.props).toEqual({
        treasure: {
          id: 9, name: 'Potion', value: 50, photo_path: null, game_type: 'deadlands',
        },
        quantity: 2,
      });
    });

    it('has an empty-state text key', function() {
      expect(treasure.emptyTextKey).toBe('character_treasures_preview.empty');
    });
  });

  describe('.item', function() {
    const { item: itemConfig } = shortListResourceConfig;
    const pcContext = { game_slug: 'demo', id: 7, is_pc: true };

    it('builds fetch params scoped to the character', function() {
      expect(itemConfig.buildParams(pcContext)).toEqual({ gameSlug: 'demo', kind: 'pcs', id: 7 });
    });

    it('builds the see-all href to the character\'s items page', function() {
      expect(itemConfig.buildSeeAllHref(pcContext)).toBe('#/games/demo/pcs/7/items');
    });

    it('navigates to the item\'s own character-scoped detail page', function() {
      expect(itemConfig.action).toBe('navigate');
      expect(itemConfig.buildHref(pcContext, { id: 3 })).toBe('#/games/demo/pcs/7/items/3');
    });

    it('renders an ItemPreviewCard with the resolved href', function() {
      const item = { id: 3, name: 'Cloak' };
      const element = itemConfig.renderItem(item, pcContext, '#/games/demo/pcs/7/items/3');

      expect(element.type).toBe(ItemPreviewCard);
      expect(element.props).toEqual({ item, href: '#/games/demo/pcs/7/items/3' });
    });

    it('has an empty-state text key', function() {
      expect(itemConfig.emptyTextKey).toBe('character_items_preview.empty');
    });
  });

  describe('.document', function() {
    const { document: documentConfig } = shortListResourceConfig;
    const pcContext = { game_slug: 'demo', id: 7, is_pc: true };

    it('builds fetch params scoped to the character', function() {
      expect(documentConfig.buildParams(pcContext)).toEqual({ gameSlug: 'demo', kind: 'pcs', id: 7 });
    });

    it('builds the see-all href to the character\'s documents page', function() {
      expect(documentConfig.buildSeeAllHref(pcContext)).toBe('#/games/demo/pcs/7/documents');
    });

    it('navigates to the document\'s own character-scoped detail page (issue #892)', function() {
      expect(documentConfig.action).toBe('navigate');
      expect(documentConfig.buildHref(pcContext, { id: 3 })).toBe('#/games/demo/pcs/7/documents/3');
    });

    it('renders a DocumentPreviewCard with the resolved href', function() {
      const item = { id: 1, name: 'Ancient Tome' };
      const element = documentConfig.renderItem(item, pcContext, '#/games/demo/pcs/7/documents/1');

      expect(element.type).toBe(DocumentPreviewCard);
      expect(element.props).toEqual({ document: item, href: '#/games/demo/pcs/7/documents/1' });
    });

    it('has an empty-state text key', function() {
      expect(documentConfig.emptyTextKey).toBe('character_documents_preview.empty');
    });
  });

  describe('.possession', function() {
    const { possession: possessionConfig } = shortListResourceConfig;
    const pcContext = { game_slug: 'demo', id: 7, is_pc: true };

    it('builds fetch params scoped to the character', function() {
      expect(possessionConfig.buildParams(pcContext)).toEqual({ gameSlug: 'demo', kind: 'pcs', id: 7 });
    });

    it('builds the see-all href to the character\'s possessions page', function() {
      expect(possessionConfig.buildSeeAllHref(pcContext)).toBe('#/games/demo/pcs/7/possessions');
    });

    it('navigates to the possession\'s own character-scoped detail page', function() {
      expect(possessionConfig.action).toBe('navigate');
      expect(possessionConfig.buildHref(pcContext, { id: 3 })).toBe('#/games/demo/pcs/7/possessions/3');
    });

    it('renders a PossessionPreviewCard with the resolved href', function() {
      const item = { id: 1, name: 'Manor House' };
      const element = possessionConfig.renderItem(item, pcContext, '#/games/demo/pcs/7/possessions/1');

      expect(element.type).toBe(PossessionPreviewCard);
      expect(element.props).toEqual({ possession: item, href: '#/games/demo/pcs/7/possessions/1' });
    });

    it('has an empty-state text key', function() {
      expect(possessionConfig.emptyTextKey).toBe('character_possessions_preview.empty');
    });
  });
});
