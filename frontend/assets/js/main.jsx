import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../assets/css/styles.css';
import '../../assets/css/main.scss';

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
