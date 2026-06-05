import AppHelper from './helpers/AppHelper.jsx';
import HashRouteResolver from '../utils/HashRouteResolver.js';

/**
 * Controller for application-level hash routing.
 */
export default class AppController {
  /**
   * Create an app controller.
   *
   * @param {Function} setPage - React state setter for page.
   * @param {EventTarget} eventTarget - Target used to bind events.
   * @param {Function} hashProvider - Function returning hash.
   * @param {Function|null} setHash - Optional hash state setter.
   */
  constructor(
    setPage,
    eventTarget = window,
    hashProvider = () => window.location.hash,
    setHash = null,
  ) {
    this.setPage = setPage;
    this.eventTarget = eventTarget;
    this.setHash = setHash;
    this.routeResolver = new HashRouteResolver(hashProvider);
  }

  /**
   * Resolve current page.
   *
   * @returns {string} Current page key.
   */
  getPage() {
    return this.routeResolver.getPage();
  }

  /**
   * Render page element.
   *
   * @param {string} page - Page identifier.
   * @param {string} hash - Current hash.
   * @returns {React.ReactElement} Rendered app tree.
   */
  renderPage(page, hash = '') {
    return AppHelper.render(page, hash);
  }

  /**
   * Build react effect that listens to hash changes.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      const handleHashChange = () => {
        this.setPage(this.getPage());
        this.setHash?.(this.routeResolver.currentHash());
      };

      this.eventTarget.addEventListener('hashchange', handleHashChange);

      return () => {
        this.eventTarget.removeEventListener('hashchange', handleHashChange);
      };
    };
  }
}
