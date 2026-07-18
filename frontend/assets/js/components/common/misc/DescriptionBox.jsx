import { useLayoutEffect, useRef, useState } from 'react';
import DescriptionBoxHelper from './helpers/DescriptionBoxHelper.jsx';

const MAX_COLLAPSED_HEIGHT = 128;

/**
 * Stateful show-page "description box", shared by `game.description`,
 * `pc`/`npc` `public_description`, and `pc`/`npc` `private_description`.
 * Renders a bordered box with a max height, growing into a "Show more" /
 * "Show less" toggle whenever the content overflows the collapsed height.
 *
 * @param {object} props - Component props.
 * @param {string} [props.description] - Description text to render.
 * @returns {React.ReactElement|null} Description box element, or null when description is absent.
 */
export default function DescriptionBox({ description }) {
  const boxRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    if (!boxRef.current) return;

    setIsOverflowing(boxRef.current.scrollHeight > MAX_COLLAPSED_HEIGHT);
  }, [description]);

  return DescriptionBoxHelper.render(
    description,
    { expanded, isOverflowing, maxCollapsedHeight: MAX_COLLAPSED_HEIGHT },
    { boxRef, onToggle: () => setExpanded((current) => !current) },
  );
}
