import GameRecipeListItem from '../../../../../../assets/js/components/common/list_types/GameRecipeListItem.js';
import BaseListItem from '../../../../../../assets/js/components/common/list_types/BaseListItem.js';

describe('GameRecipeListItem', function() {
  const output = { id: 3, name: 'Healing Potion', photo_path: '/photos/3.png', category: 'potion' };

  it('extends BaseListItem', function() {
    expect(new GameRecipeListItem({ id: 1, name: 'Brew' }) instanceof BaseListItem).toBe(true);
  });

  it('uses the recipe name as display text', function() {
    expect(new GameRecipeListItem({ id: 1, name: 'Brew', output }).displayText).toBe('Brew');
  });

  describe('#photoUrl', function() {
    it("returns the output's photo path", function() {
      expect(new GameRecipeListItem({ id: 1, name: 'Brew', output }).photoUrl).toBe('/photos/3.png');
    });

    it('returns null when the output is masked', function() {
      expect(new GameRecipeListItem({ id: 1, name: 'Brew', output: null }).photoUrl).toBeNull();
    });

    it('returns null when the output has no photo', function() {
      const item = new GameRecipeListItem({ id: 1, name: 'Brew', output: { ...output, photo_path: null } });

      expect(item.photoUrl).toBeNull();
    });
  });

  describe('#formattedValue', function() {
    it('renders the output name and yield', function() {
      const item = new GameRecipeListItem({ id: 1, name: 'Brew', output, yield_quantity: 2 });

      expect(item.formattedValue).toBe('Healing Potion × 2');
    });

    it('renders the unknown output label when the output is masked', function() {
      const item = new GameRecipeListItem({ id: 1, name: 'Brew', output: null, yield_quantity: 1 });

      expect(item.formattedValue).toBe('Unknown item × 1');
    });
  });

  describe('#hidden', function() {
    it('is true when the raw entry is hidden', function() {
      expect(new GameRecipeListItem({ id: 1, name: 'Brew', hidden: true }).hidden).toBe(true);
    });

    it('is false when the raw entry is not hidden', function() {
      expect(new GameRecipeListItem({ id: 1, name: 'Brew' }).hidden).toBe(false);
    });
  });
});
