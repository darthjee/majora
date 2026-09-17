import { useEffect } from 'react';

/**
 * Wires GameCommonItemEdit's field-sync effect: applies the loaded `commonItem`'s
 * `name`/`description`/`price`/`category`/`hidden` values onto local form state, via
 * `controller.applyLoadedItem`, whenever a newly-loaded `commonItem` is passed in.
 *
 * @param {GameCommonItemEditController} controller - Owns `applyLoadedItem`.
 * @param {object} commonItem - Loaded common item data object, or `null` while still loading.
 * @param {Function} setField - Form-state setter, called as `setField(name, value)`.
 * @returns {void}
 */
export default function useApplyLoadedCommonItem(controller, commonItem, setField) {
  useEffect(() => {
    controller.applyLoadedItem(commonItem, {
      setName: (value) => setField('name', value),
      setDescription: (value) => setField('description', value),
      setPrice: (value) => setField('price', value),
      setCategory: (value) => setField('category', value),
      setHidden: (value) => setField('hidden', value),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonItem]);
}
