import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import FieldErrors from '../FieldErrors.jsx';
import Translator from '../../../../i18n/Translator.js';
import Icons from '../../../../utils/ui/Icons.js';

const TOOLBAR_ACTIONS = [
  { action: 'bold', icon: Icons.typeBold, labelKey: 'markdown_editor.bold' },
  { action: 'italic', icon: Icons.typeItalic, labelKey: 'markdown_editor.italic' },
  { action: 'heading', icon: Icons.typeH1, labelKey: 'markdown_editor.heading' },
  { action: 'bulleted_list', icon: Icons.listUl, labelKey: 'markdown_editor.bulleted_list' },
  { action: 'numbered_list', icon: Icons.listOl, labelKey: 'markdown_editor.numbered_list' },
  { action: 'link', icon: Icons.link45deg, labelKey: 'markdown_editor.link' },
];

/**
 * Rendering helper for the MarkdownEditor element.
 */
export default class MarkdownEditorHelper {
  /**
   * Render the labeled Markdown editor: a Write/Preview tab pair, a toolbar plus textarea in
   * Write mode, or a live Markdown preview in Preview mode.
   *
   * @param {string} id - Id shared between the label's `htmlFor` and the textarea.
   * @param {string} label - Translated field label.
   * @param {string} value - Current textarea value.
   * @param {string[]} errors - Field-level error messages to display below the editor.
   * @param {{activeTab: ('write'|'preview')}} state - Current active tab.
   * @param {{onChange: Function, onTabChange: Function, onToolbarAction: Function,
   *   textareaRef: object}} handlers - Change/tab/toolbar handlers and the textarea ref.
   * @returns {React.ReactElement} Markdown editor field element.
   */
  static render(id, label, value, errors, state, handlers) {
    return (
      <div className="mb-3">
        <label htmlFor={id} className="form-label">{label}</label>
        <div className="markdown-editor border rounded">
          {MarkdownEditorHelper.#renderTabs(state, handlers)}
          {state.activeTab === 'write'
            ? MarkdownEditorHelper.#renderWrite(id, value, handlers)
            : MarkdownEditorHelper.#renderPreview(value)}
        </div>
        <FieldErrors errors={errors} />
      </div>
    );
  }

  static #renderTabs(state, handlers) {
    return (
      <div className="d-flex border-bottom">
        {MarkdownEditorHelper.#renderTabButton('write', 'markdown_editor.write_tab', state, handlers)}
        {MarkdownEditorHelper.#renderTabButton('preview', 'markdown_editor.preview_tab', state, handlers)}
      </div>
    );
  }

  static #renderTabButton(tab, labelKey, state, handlers) {
    const isActive = state.activeTab === tab;

    return (
      <button
        type="button"
        className={`btn btn-sm rounded-0 ${isActive ? 'btn-light fw-bold' : 'btn-link'}`}
        onClick={() => handlers.onTabChange(tab)}
      >
        {Translator.t(labelKey)}
      </button>
    );
  }

  static #renderToolbar(handlers) {
    return (
      <div className="markdown-editor-toolbar d-flex gap-1 p-1 border-bottom">
        {TOOLBAR_ACTIONS.map(({ action, icon, labelKey }) => (
          <button
            key={action}
            type="button"
            className="btn btn-sm btn-outline-secondary border-0"
            aria-label={Translator.t(labelKey)}
            title={Translator.t(labelKey)}
            onClick={() => handlers.onToolbarAction(action)}
          >
            <i className={`bi ${icon}`}></i>
          </button>
        ))}
      </div>
    );
  }

  static #renderWrite(id, value, handlers) {
    return (
      <>
        {MarkdownEditorHelper.#renderToolbar(handlers)}
        <textarea
          id={id}
          className="form-control border-0 rounded-0"
          ref={handlers.textareaRef}
          value={value}
          onChange={handlers.onChange}
        />
      </>
    );
  }

  static #renderPreview(value) {
    return (
      <div className="markdown-editor-preview p-2">
        {value
          ? <ReactMarkdown remarkPlugins={[remarkBreaks]}>{value}</ReactMarkdown>
          : <span className="text-muted">{Translator.t('markdown_editor.preview_empty')}</span>}
      </div>
    );
  }
}
