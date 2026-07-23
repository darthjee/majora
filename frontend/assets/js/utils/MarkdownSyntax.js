const LIST_PREFIXES = {
  bulleted_list: '- ',
  numbered_list: '1. ',
};

/**
 * Pure, framework-free Markdown syntax-insertion logic for the `MarkdownEditor` toolbar.
 * Given the current textarea value and selection range, each supported action computes the
 * new value plus the selection range that should be restored on the textarea afterwards.
 */
export default class MarkdownSyntax {
  /**
   * Apply a toolbar action to the current textarea value/selection.
   *
   * @param {string} action - One of `bold`, `italic`, `heading`, `bulleted_list`,
   *   `numbered_list`, `link`.
   * @param {string} value - Current textarea value.
   * @param {number} selectionStart - Current selection start offset.
   * @param {number} selectionEnd - Current selection end offset.
   * @returns {{value: string, selectionStart: number, selectionEnd: number}} New value and the
   *   selection range to restore, unchanged when `action` is not recognized.
   */
  static apply(action, value, selectionStart, selectionEnd) {
    switch (action) {
      case 'bold':
        return MarkdownSyntax.#wrapSelection(value, selectionStart, selectionEnd, '**');
      case 'italic':
        return MarkdownSyntax.#wrapSelection(value, selectionStart, selectionEnd, '*');
      case 'heading':
        return MarkdownSyntax.#prefixLine(value, selectionStart, selectionEnd, '## ');
      case 'bulleted_list':
        return MarkdownSyntax.#prefixLine(value, selectionStart, selectionEnd, LIST_PREFIXES.bulleted_list);
      case 'numbered_list':
        return MarkdownSyntax.#prefixLine(value, selectionStart, selectionEnd, LIST_PREFIXES.numbered_list);
      case 'link':
        return MarkdownSyntax.#insertLink(value, selectionStart, selectionEnd);
      default:
        return { value, selectionStart, selectionEnd };
    }
  }

  static #wrapSelection(value, start, end, marker) {
    const selected = value.slice(start, end);
    const newValue = value.slice(0, start) + marker + selected + marker + value.slice(end);

    if (selected) {
      return { value: newValue, selectionStart: start + marker.length, selectionEnd: start + marker.length + selected.length };
    }

    const cursor = start + marker.length;
    return { value: newValue, selectionStart: cursor, selectionEnd: cursor };
  }

  static #prefixLine(value, start, end, prefix) {
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const newValue = value.slice(0, lineStart) + prefix + value.slice(lineStart);

    return { value: newValue, selectionStart: start + prefix.length, selectionEnd: end + prefix.length };
  }

  static #insertLink(value, start, end) {
    const selected = value.slice(start, end);
    const text = selected || 'link';
    const insertion = `[${text}](url)`;
    const newValue = value.slice(0, start) + insertion + value.slice(end);

    const urlStart = start + text.length + 3;
    const urlEnd = urlStart + 3;

    return { value: newValue, selectionStart: urlStart, selectionEnd: urlEnd };
  }
}
