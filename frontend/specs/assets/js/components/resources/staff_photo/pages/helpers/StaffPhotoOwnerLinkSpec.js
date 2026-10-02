import buildStaffPhotoOwnerLink from '../../../../../../../../assets/js/components/resources/staff_photo/pages/helpers/StaffPhotoOwnerLink.js';

const game = { slug: 'demo', name: 'Demo' };

/**
 * Builds an owner fixture.
 *
 * @param {object} attrs - Overrides.
 * @returns {object} Owner.
 */
function owner(attrs) {
  return { id: 7, name: 'Owner Name', kind: null, game, ...attrs };
}

describe('buildStaffPhotoOwnerLink', function() {
  const linkedCases = [
    ['game', '#/games/demo'],
    ['game_faction', '#/games/demo/factions/7'],
    ['game_item', '#/games/demo/items/7'],
    ['game_common_item', '#/games/demo/common_items/7'],
    ['game_document', '#/games/demo/documents/7'],
    ['game_possession', '#/games/demo/possessions/7'],
    ['treasure', '#/games/demo/treasures/7'],
  ];

  linkedCases.forEach(([type, href]) => {
    it(`links a ${type} owner to ${href}`, function() {
      expect(buildStaffPhotoOwnerLink(owner({ type }))).toEqual({ href, text: 'Owner Name' });
    });
  });

  it('links a pc character owner under pcs', function() {
    expect(buildStaffPhotoOwnerLink(owner({ type: 'character', kind: 'pc' })).href)
      .toBe('#/games/demo/pcs/7');
  });

  it('links an npc character owner under npcs', function() {
    expect(buildStaffPhotoOwnerLink(owner({ type: 'character', kind: 'npc' })).href)
      .toBe('#/games/demo/npcs/7');
  });

  it('links a treasure without a game to the top-level treasure page', function() {
    expect(buildStaffPhotoOwnerLink(owner({ type: 'treasure', game: null })).href).toBe('#/treasures/7');
  });

  const miniatureCases = [
    ['stl_model', '#/miniatures/stl_models/7'],
    ['source', '#/miniatures/sources/7'],
    ['collection', '#/miniatures/collections/7'],
  ];

  miniatureCases.forEach(([type, href]) => {
    it(`links a ${type} owner to ${href}`, function() {
      expect(buildStaffPhotoOwnerLink(owner({ type, game: null }))).toEqual({ href, text: 'Owner Name' });
    });
  });

  ['character_item', 'game_document_file'].forEach((type) => {
    it(`renders a ${type} owner as plain text`, function() {
      expect(buildStaffPhotoOwnerLink(owner({ type }))).toEqual({ href: null, text: 'Owner Name' });
    });
  });

  ['game', 'game_faction', 'game_item', 'game_common_item', 'game_document', 'game_possession', 'character']
    .forEach((type) => {
      it(`renders a ${type} owner without a game as plain text`, function() {
        expect(buildStaffPhotoOwnerLink(owner({ type, game: null })).href).toBeNull();
      });
    });

  it('renders an unknown owner type as plain text', function() {
    expect(buildStaffPhotoOwnerLink(owner({ type: 'mystery' }))).toEqual({ href: null, text: 'Owner Name' });
  });
});
