import Badge from '../badges/Badge.jsx';
import FieldErrors from './FieldErrors.jsx';

/**
 * Handle a keydown event on the tags text input, invoking `onAdd` (and preventing the default
 * form submission) when the pressed key is Enter. Extracted as a plain, named function (rather
 * than inlined in the component) so it can be exercised directly in specs without depending on a
 * DOM environment (`renderToStaticMarkup` cannot simulate keyboard events).
 *
 * @param {{key: string, preventDefault: Function}} event - Keydown event.
 * @param {Function} onAdd - Handler to invoke when Enter is pressed.
 * @returns {void}
 */
export function handleTagsFieldKeyDown(event, onAdd) {
  if (event.key === 'Enter') {
    event.preventDefault();
    onAdd();
  }
}

/**
 * Generic tags editor: renders the current pending tags as badges, followed by a text input and
 * an "Add" button. Typing one or more comma-separated values and either pressing Enter or
 * clicking "Add" is handled entirely by the caller's `onAdd` handler (the split/trim/blank-drop/
 * dedupe logic lives there, not here) — this component only renders whatever `tags` list it is
 * given and forwards the raw input value.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Id shared between the label's `htmlFor` and the text input.
 * @param {string} props.label - Translated field label.
 * @param {string} [props.placeholder] - Translated placeholder for the text input.
 * @param {string} props.addLabel - Translated label for the "Add" button.
 * @param {string[]} props.tags - Current pending tags, rendered as badges.
 * @param {string} props.inputValue - Current raw text input value.
 * @param {Function} props.onInputChange - Change handler for the text input.
 * @param {Function} props.onAdd - Handler invoked on both the "Add" button click and pressing
 *   Enter in the text input.
 * @param {string[]} [props.errors] - Field-level error messages to display below the input.
 * @returns {React.ReactElement} Tags field element.
 */
export default function TagsField({
  id, label, placeholder, addLabel, tags, inputValue, onInputChange, onAdd, errors = [],
}) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">{label}</label>
      <div className="mb-2">
        {tags.map((tag) => (
          <span key={tag} className="me-1 d-inline-block">
            <Badge text={tag} />
          </span>
        ))}
      </div>
      <div className="d-flex">
        <input
          id={id}
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={inputValue}
          onChange={onInputChange}
          onKeyDown={(event) => handleTagsFieldKeyDown(event, onAdd)}
        />
        <button type="button" className="btn btn-secondary ms-2" onClick={onAdd}>
          {addLabel}
        </button>
      </div>
      <FieldErrors errors={errors} />
    </div>
  );
}
