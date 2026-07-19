/**
 * Group items into a `Map` keyed by `keyFn(item)`, preserving each group's
 * item order.
 *
 * @param {Array} items - Items to group.
 * @param {Function} keyFn - Called with each item to derive its group key.
 * @returns {Map} Map of key to the array of items sharing that key.
 */
export default function groupBy(items, keyFn) {
  return items.reduce((groups, item) => {
    const key = keyFn(item);
    const group = groups.get(key) ?? [];

    group.push(item);
    groups.set(key, group);

    return groups;
  }, new Map());
}
