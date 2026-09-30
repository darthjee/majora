import React from 'react';
import DescriptionBox from '../../../../../common/misc/DescriptionBox.jsx';

/**
 * A titled markdown section of the recipe show page (description / ingredients / checks),
 * omitted entirely when its text is empty.
 *
 * @param {object} props - Component props.
 * @param {string} props.title - Already-translated section heading.
 * @param {string} [props.text] - Markdown text.
 * @returns {React.ReactElement|null} Section element, or null when the text is empty.
 */
export default function RecipeTextSection({ title, text }) {
  if (!text) {
    return null;
  }

  return (
    <section className="mb-3">
      <h5>{title}</h5>
      <DescriptionBox description={text} />
    </section>
  );
}
