import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import Translator from '../../../../i18n/Translator.js';

/**
 * Rendering helper for the DescriptionBox element.
 */
export default class DescriptionBoxHelper {
  /**
   * Render the bordered, collapsible description box, or null when description is absent.
   *
   * @param {string} [description] - Description text to render.
   * @param {{expanded: boolean, isOverflowing: boolean, maxCollapsedHeight: number}} state -
   *   Current expanded/overflow state and the collapsed max-height in pixels.
   * @param {{boxRef: object, onToggle: Function}} handlers - Box ref and toggle click handler.
   * @returns {React.ReactElement|null} Description box element, or null.
   */
  static render(description, state, handlers) {
    if (!description) return null;

    return (
      <div className="mt-3">
        <div
          ref={handlers.boxRef}
          className="description-box-content p-3 border rounded bg-light"
          style={{
            overflow: 'hidden',
            maxHeight: state.expanded ? 'none' : state.maxCollapsedHeight,
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkBreaks]}>{description}</ReactMarkdown>
        </div>
        {DescriptionBoxHelper.#renderToggle(state, handlers)}
      </div>
    );
  }

  static #renderToggle(state, handlers) {
    if (!state.isOverflowing) return null;

    const labelKey = state.expanded ? 'description_box.show_less' : 'description_box.show_more';

    return (
      <button
        type="button"
        className="btn btn-link btn-sm p-0 mt-1"
        onClick={handlers.onToggle}
      >
        {Translator.t(labelKey)}
      </button>
    );
  }
}
