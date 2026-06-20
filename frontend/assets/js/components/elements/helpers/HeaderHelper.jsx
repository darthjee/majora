import React from 'react';

/**
 * Rendering helper for the Header element.
 */
export default class HeaderHelper {
  /**
   * Render the application header with navigation.
   *
   * @returns {React.ReactElement} Header element.
   */
  static render() {
    return (
      <header>
        <h1>
          <a href="#/">Majora</a>
        </h1>
        <p>RPG Campaign Management System</p>
        <nav>
          <ul>
            <li>
              <a href="#/games">Games</a>
            </li>
          </ul>
          <span data-testid="auth-placeholder">
            {/* Login/logout is not implemented yet */}
            Login
          </span>
        </nav>
      </header>
    );
  }
}
