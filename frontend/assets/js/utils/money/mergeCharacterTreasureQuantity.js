/**
 * Merges an updated owned-treasure quantity into a character's treasure
 * list, used after a successful buy/sell action to reflect the change
 * without a full page refetch.
 *
 * @param {object[]} treasures - Current list of owned treasure entries (`id`, `treasure_id`,
 *   `name`, `quantity`, `value`, `photo_path`).
 * @param {number|string} treasureId - The underlying treasure's id.
 * @param {object|null} treasureInfo - Treasure display data (`name`, `value`, `photo_path`),
 *   used to build a brand-new entry when the treasure was not previously owned.
 * @param {number} quantity - The new owned quantity, as returned by the buy/sell endpoint.
 * @returns {object[]} The updated treasures list, with zero-quantity entries removed.
 */
export default function mergeCharacterTreasureQuantity(treasures, treasureId, treasureInfo, quantity) {
  const index = treasures.findIndex((entry) => `${entry.treasure_id}` === `${treasureId}`);

  if (quantity <= 0) {
    return index === -1 ? treasures : treasures.filter((entry) => `${entry.treasure_id}` !== `${treasureId}`);
  }

  if (index === -1) {
    return [...treasures, { id: treasureId, treasure_id: treasureId, quantity, ...treasureInfo }];
  }

  const updated = [...treasures];
  updated[index] = { ...updated[index], quantity };
  return updated;
}
