import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import '../../assets/css/styles.css';

/**
 * Build the root React tree for the frontend application.
 *
 * @returns {React.ReactElement} The application tree.
 */
export function createAppElement() {
  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

/**
 * Render the frontend application into the provided container.
 *
 * @param {Element} container - Root DOM container.
 * @returns {import('react-dom/client').Root} The React root instance.
 */
export function renderApplication(container) {
  const root = createRoot(container);
  root.render(createAppElement());
  return root;
}

const container = globalThis.document?.getElementById('root');

if (container) {
  renderApplication(container);
}
