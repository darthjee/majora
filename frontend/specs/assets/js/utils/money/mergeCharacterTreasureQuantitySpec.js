import mergeCharacterTreasureQuantity from '../../../../../assets/js/utils/money/mergeCharacterTreasureQuantity.js';

describe('mergeCharacterTreasureQuantity', function() {
  const treasures = [
    { id: 1, treasure_id: 11, name: 'Golden Crown', quantity: 1, value: 500 },
    { id: 2, treasure_id: 12, name: 'Silver Ring', quantity: 3, value: 50 },
  ];

  it('updates the quantity of an existing entry', function() {
    const result = mergeCharacterTreasureQuantity(treasures, 12, { name: 'Silver Ring', value: 50 }, 5);

    expect(result).toEqual([
      { id: 1, treasure_id: 11, name: 'Golden Crown', quantity: 1, value: 500 },
      { id: 2, treasure_id: 12, name: 'Silver Ring', quantity: 5, value: 50 },
    ]);
  });

  it('does not mutate the original array', function() {
    mergeCharacterTreasureQuantity(treasures, 12, { name: 'Silver Ring', value: 50 }, 5);

    expect(treasures[1].quantity).toBe(3);
  });

  it('adds a new entry when the treasure was not previously owned', function() {
    const result = mergeCharacterTreasureQuantity(
      treasures, 20, { name: 'Potion of Healing', value: 25, photo_path: null }, 2
    );

    expect(result).toEqual([
      ...treasures,
      {
        id: 20, treasure_id: 20, quantity: 2, name: 'Potion of Healing', value: 25, photo_path: null,
      },
    ]);
  });

  it('removes the entry when the resulting quantity is 0', function() {
    const result = mergeCharacterTreasureQuantity(treasures, 12, { name: 'Silver Ring', value: 50 }, 0);

    expect(result).toEqual([{ id: 1, treasure_id: 11, name: 'Golden Crown', quantity: 1, value: 500 }]);
  });

  it('returns the original list unchanged when a never-owned treasure is fully sold off', function() {
    const result = mergeCharacterTreasureQuantity(treasures, 99, { name: 'Unowned', value: 10 }, 0);

    expect(result).toBe(treasures);
  });
});
