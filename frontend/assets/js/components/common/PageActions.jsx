import React from 'react';
import BackButton from './BackButton.jsx';

/**
 * Page actions bar containing a back button and optional action buttons.
 *
 * @param {object} props - Component props.
 * @param {string} props.backHref - Hash path for the back button navigation.
 * @param {React.ReactNode} props.children - Action buttons (e.g. EditButton, NewButton).
 * @returns {React.ReactElement} Page actions bar element.
 */
export default function PageActions({ backHref, children }) {
  return (
    <div>
      <BackButton href={backHref} />
      {children}
    </div>
  );
}
