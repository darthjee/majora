# Issue: Change description to be a textbox

## Description
Characters have two description fields — `public_description` (visible to all) and `private_description` (DM notes only). Both fields are already stored as `TextField` in the database (complete). However, in the edit form they render as single-line `<input type="text">` fields, and on the show page they are displayed without a visually distinct container.

## Problem
- **Edit form**: `public_description` and `private_description` use `<input type="text">` (single-line), which is unsuitable for multi-line text.
- **Show page**: Both descriptions render as plain `<p>` tags, without visual distinction or line-break preservation.

## Expected Behavior
- **Edit form**: Both description fields render as `<textarea>` so users can enter multi-line text.
- **Show page**: Both descriptions are displayed inside a visually distinct styled container (e.g. a bordered or shaded block) that clearly frames the text.

## Solution
1. Create a new `TextareaField` component (`frontend/assets/js/components/elements/TextareaField.jsx`) — a labeled `<textarea>` with the same error display as `FormField`.
2. **`BaseCharacterEditHelper.jsx`**: replace the description `FormField` calls with `TextareaField` for both `public_description` and `private_description`.
3. **Show page** (`CharacterInfoHelper.jsx` and `CharacterHelper.jsx`): replace the plain `<p>` wrappers with a visually distinct styled container component (or CSS class) for both description fields.

---

Tags: :shipit:
