import {
  MAX_PREVIEW_ITEMS, MAX_PREVIEW_PHOTOS, PREVIEW_LIST_TYPES,
} from '../../../../../../assets/js/components/common/cards/characterPreviewConstants.js';
import Icons from '../../../../../../assets/js/utils/ui/Icons.js';

describe('characterPreviewConstants', function() {
  it('caps preview items at 5', function() {
    expect(MAX_PREVIEW_ITEMS).toBe(5);
  });

  it('caps preview photos at 11', function() {
    expect(MAX_PREVIEW_PHOTOS).toBe(11);
  });

  describe('PREVIEW_LIST_TYPES.pc', function() {
    it('provides the title key and icon', function() {
      expect(PREVIEW_LIST_TYPES.pc.titleKey).toBe('game_page.player_characters');
      expect(PREVIEW_LIST_TYPES.pc.icon).toBe(Icons.filePerson);
    });

    it('builds the pcs endpoint from a game slug', function() {
      expect(PREVIEW_LIST_TYPES.pc.buildEndpoint({ gameSlug: 'epic-quest' }))
        .toBe('/games/epic-quest/pcs.json');
    });
  });

  describe('PREVIEW_LIST_TYPES.npc', function() {
    it('provides the title key and icon', function() {
      expect(PREVIEW_LIST_TYPES.npc.titleKey).toBe('game_page.non_player_characters');
      expect(PREVIEW_LIST_TYPES.npc.icon).toBe(Icons.filePersonFill);
    });

    it('builds the public npcs endpoint from a game slug', function() {
      expect(PREVIEW_LIST_TYPES.npc.buildEndpoint({ gameSlug: 'epic-quest' }))
        .toBe('/games/epic-quest/npcs.json');
    });

    it('builds the authenticated npcs endpoint from a game slug', function() {
      expect(PREVIEW_LIST_TYPES.npc.buildAuthEndpoint({ gameSlug: 'epic-quest' }))
        .toBe('/games/epic-quest/npcs/all.json');
    });
  });

  describe('PREVIEW_LIST_TYPES.treasure', function() {
    it('provides the title key and icon', function() {
      expect(PREVIEW_LIST_TYPES.treasure.titleKey).toBe('character_page.treasures_title');
      expect(PREVIEW_LIST_TYPES.treasure.icon).toBe(Icons.gem);
    });

    it('does not provide an endpoint builder', function() {
      expect(PREVIEW_LIST_TYPES.treasure.buildEndpoint).toBeUndefined();
      expect(PREVIEW_LIST_TYPES.treasure.buildAuthEndpoint).toBeUndefined();
    });
  });

  describe('PREVIEW_LIST_TYPES.item', function() {
    it('provides the title key and icon', function() {
      expect(PREVIEW_LIST_TYPES.item.titleKey).toBe('character_page.items_title');
      expect(PREVIEW_LIST_TYPES.item.icon).toBe(Icons.box2HeartFill);
    });

    it('does not provide an endpoint builder', function() {
      expect(PREVIEW_LIST_TYPES.item.buildEndpoint).toBeUndefined();
      expect(PREVIEW_LIST_TYPES.item.buildAuthEndpoint).toBeUndefined();
    });
  });
});
