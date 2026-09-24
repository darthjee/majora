import {
  DEFAULT_TASK_CATEGORY,
  TASK_CATEGORY_VALUES,
  normalizeTaskCategory,
  toTaskCategoryPick,
  translateTaskCategory,
} from '../../../../../../../assets/js/components/resources/game/pages/taskCategories.js';

describe('taskCategories', function() {
  describe('TASK_CATEGORY_VALUES', function() {
    it('lists the categories in the backend order, with other last', function() {
      expect(TASK_CATEGORY_VALUES).toEqual([
        'printing', 'crafting', 'painting', 'planning', 'writing',
        'research', 'scheduling', 'buying', 'updating', 'other',
      ]);
    });
  });

  describe('DEFAULT_TASK_CATEGORY', function() {
    it('is other', function() {
      expect(DEFAULT_TASK_CATEGORY).toBe('other');
    });
  });

  describe('.normalizeTaskCategory', function() {
    it('keeps a known value', function() {
      expect(normalizeTaskCategory('painting')).toBe('painting');
    });

    it('falls back to other for a missing value', function() {
      expect(normalizeTaskCategory(undefined)).toBe('other');
      expect(normalizeTaskCategory(null)).toBe('other');
    });

    it('falls back to other for an unknown value', function() {
      expect(normalizeTaskCategory('cooking')).toBe('other');
    });
  });

  describe('.translateTaskCategory', function() {
    it('translates a known value', function() {
      expect(translateTaskCategory('painting')).toBe('Painting');
    });

    it('translates every known value without exposing a raw key', function() {
      TASK_CATEGORY_VALUES.forEach((value) => {
        expect(translateTaskCategory(value)).not.toContain('game_task.category');
      });
    });

    it('uses the other label for a missing value', function() {
      expect(translateTaskCategory(undefined)).toBe('Other');
    });

    it('uses the other label for an unknown value', function() {
      expect(translateTaskCategory('cooking')).toBe('Other');
    });
  });

  describe('.toTaskCategoryPick', function() {
    it('shapes a known value as {id, name}', function() {
      expect(toTaskCategoryPick('buying')).toEqual({ id: 'buying', name: 'Buying' });
    });

    it('shapes an unknown value as the other pick', function() {
      expect(toTaskCategoryPick('cooking')).toEqual({ id: 'other', name: 'Other' });
    });
  });
});
