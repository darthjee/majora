import { useState } from 'react';
import { buildTagsAfterAdd } from '../StlModelNew.jsx';

/**
 * Wires StlModelNew's pending-tag-input state and add/remove handlers on top of the `tags`
 * form field, deferring the actual dedup/split logic to the existing `buildTagsAfterAdd` helper.
 *
 * @param {string[]} tags - Current `tags` field value.
 * @param {Function} setField - Form-state setter, called as `setField('tags', newTags)`.
 * @returns {{tagInput: string, onTagInputChange: Function, handleAddTag: Function,
 *   handleRemoveTag: Function}} `tagInput` — current raw comma-separated input value;
 *   `onTagInputChange` — `onChange` handler updating `tagInput` from an input event;
 *   `handleAddTag` — appends `tagInput`'s pieces to `tags` and clears `tagInput`;
 *   `handleRemoveTag(tag)` — removes a single tag from `tags`.
 */
export default function useTagsField(tags, setField) {
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    setField('tags', buildTagsAfterAdd(tags, tagInput));
    setTagInput('');
  };

  const handleRemoveTag = (tag) => setField('tags', tags.filter((t) => t !== tag));

  return {
    tagInput,
    onTagInputChange: (event) => setTagInput(event.target.value),
    handleAddTag,
    handleRemoveTag,
  };
}
