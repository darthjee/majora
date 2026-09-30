import {
  MAX_PREVIEW_ITEMS, MAX_PREVIEW_PHOTOS, MAX_PREVIEW_DOCUMENT_FILES, MAX_PREVIEW_DOCUMENT_PHOTOS,
  PREVIEW_LIST_TYPES,
} from '../../../../../../assets/js/components/common/cards/characterPreviewConstants.js';
import Icons from '../../../../../../assets/js/utils/ui/Icons.js';

describe('characterPreviewConstants', function() {
  it('caps preview items at 5', function() {
    expect(MAX_PREVIEW_ITEMS).toBe(5);
  });

  it('caps preview photos (character-photo preview section) at 11', function() {
    expect(MAX_PREVIEW_PHOTOS).toBe(11);
  });

  it('caps document files preview at 17', function() {
    expect(MAX_PREVIEW_DOCUMENT_FILES).toBe(17);
  });

  it('caps document photos preview at 17', function() {
    expect(MAX_PREVIEW_DOCUMENT_PHOTOS).toBe(17);
  });

  describe('PREVIEW_LIST_TYPES.pc', function() {
    it('provides the title key and icon', function() {
      expect(PREVIEW_LIST_TYPES.pc.titleKey).toBe('game_page.player_characters');
      expect(PREVIEW_LIST_TYPES.pc.icon).toBe(Icons.filePerson);
    });

    it('does not provide an endpoint builder', function() {
      expect(PREVIEW_LIST_TYPES.pc.buildEndpoint).toBeUndefined();
      expect(PREVIEW_LIST_TYPES.pc.buildAuthEndpoint).toBeUndefined();
    });
  });

  describe('PREVIEW_LIST_TYPES.npc', function() {
    it('provides the title key and icon', function() {
      expect(PREVIEW_LIST_TYPES.npc.titleKey).toBe('game_page.non_player_characters');
      expect(PREVIEW_LIST_TYPES.npc.icon).toBe(Icons.filePersonFill);
    });

    it('does not provide an endpoint builder', function() {
      expect(PREVIEW_LIST_TYPES.npc.buildEndpoint).toBeUndefined();
      expect(PREVIEW_LIST_TYPES.npc.buildAuthEndpoint).toBeUndefined();
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

  describe('PREVIEW_LIST_TYPES.document', function() {
    it('provides the title key and icon', function() {
      expect(PREVIEW_LIST_TYPES.document.titleKey).toBe('character_page.documents_title');
      expect(PREVIEW_LIST_TYPES.document.icon).toBe(Icons.folder);
    });

    it('does not provide an endpoint builder', function() {
      expect(PREVIEW_LIST_TYPES.document.buildEndpoint).toBeUndefined();
      expect(PREVIEW_LIST_TYPES.document.buildAuthEndpoint).toBeUndefined();
    });
  });

  describe('PREVIEW_LIST_TYPES.possession', function() {
    it('provides the title key and icon', function() {
      expect(PREVIEW_LIST_TYPES.possession.titleKey).toBe('character_page.possessions_title');
      expect(PREVIEW_LIST_TYPES.possession.icon).toBe(Icons.houseDoor);
    });

    it('does not provide an endpoint builder', function() {
      expect(PREVIEW_LIST_TYPES.possession.buildEndpoint).toBeUndefined();
      expect(PREVIEW_LIST_TYPES.possession.buildAuthEndpoint).toBeUndefined();
    });
  });

  describe('PREVIEW_LIST_TYPES.faction', function() {
    it('provides the title key and icon', function() {
      expect(PREVIEW_LIST_TYPES.faction.titleKey).toBe('character_page.factions_title');
      expect(PREVIEW_LIST_TYPES.faction.icon).toBe(Icons.peopleFill);
    });

    it('does not provide an endpoint builder', function() {
      expect(PREVIEW_LIST_TYPES.faction.buildEndpoint).toBeUndefined();
      expect(PREVIEW_LIST_TYPES.faction.buildAuthEndpoint).toBeUndefined();
    });
  });

  describe('PREVIEW_LIST_TYPES.commonItemRecipe', function() {
    it('provides the title key and icon', function() {
      expect(PREVIEW_LIST_TYPES.commonItemRecipe.titleKey).toBe('common_item_recipes_preview.title');
      expect(PREVIEW_LIST_TYPES.commonItemRecipe.icon).toBe(Icons.bookHalf);
    });
  });

  describe('PREVIEW_LIST_TYPES.recipe', function() {
    it('provides the title key and icon', function() {
      expect(PREVIEW_LIST_TYPES.recipe.titleKey).toBe('character_page.recipes_title');
      expect(PREVIEW_LIST_TYPES.recipe.icon).toBe(Icons.bookHalf);
    });
  });

  describe('PREVIEW_LIST_TYPES.recipeCharacter', function() {
    it('provides the title key and icon', function() {
      expect(PREVIEW_LIST_TYPES.recipeCharacter.titleKey).toBe('recipe_page.known_by_title');
      expect(PREVIEW_LIST_TYPES.recipeCharacter.icon).toBe(Icons.peopleFill);
    });
  });
});
