import { useLayoutEffect, useRef, useState } from 'react';
import MarkdownEditorHelper from './helpers/MarkdownEditorHelper.jsx';
import MarkdownSyntax from '../../../utils/MarkdownSyntax.js';

/**
 * Labeled Markdown editor, a drop-in replacement for `TextareaField` on every description-like
 * field. Adds a toolbar that inserts Markdown syntax into the textarea plus a "Write"/"Preview"
 * tab pair, whose preview reuses the same `ReactMarkdown` rendering used on show pages.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Id shared between the label's `htmlFor` and the textarea.
 * @param {string} props.label - Translated label text.
 * @param {string} props.value - Current textarea value.
 * @param {Function} props.onChange - Change handler, called with an `{ target: { value } }`
 *   event shape (matching a real textarea change event) on every edit, including toolbar
 *   actions.
 * @param {string[]} [props.errors] - Field-level error messages to display below the editor.
 * @returns {React.ReactElement} Labeled Markdown editor field.
 */
export default function MarkdownEditor({ id, label, value, onChange, errors = [] }) {
  const [activeTab, setActiveTab] = useState('write');
  const textareaRef = useRef(null);
  const pendingSelectionRef = useRef(null);

  useLayoutEffect(() => {
    if (!pendingSelectionRef.current || !textareaRef.current) return;

    const { selectionStart, selectionEnd } = pendingSelectionRef.current;
    pendingSelectionRef.current = null;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(selectionStart, selectionEnd);
  }, [value]);

  const onToolbarAction = (action) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const result = MarkdownSyntax.apply(action, value, textarea.selectionStart, textarea.selectionEnd);
    pendingSelectionRef.current = { selectionStart: result.selectionStart, selectionEnd: result.selectionEnd };
    onChange({ target: { value: result.value } });
  };

  return MarkdownEditorHelper.render(
    id,
    label,
    value,
    errors,
    { activeTab },
    { onChange, onTabChange: setActiveTab, onToolbarAction, textareaRef },
  );
}
