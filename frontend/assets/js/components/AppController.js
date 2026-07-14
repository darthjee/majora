import AppHelper from './helpers/AppHelper.jsx';
import HashRouteResolver from '../utils/routing/HashRouteResolver.js';
import LanguageEvents from '../i18n/LanguageEvents.js';
import AuthEvents from '../utils/auth/AuthEvents.js';
import AccessStore from '../utils/access/store/AccessStore.js';
import AccessRouteConfigStore from '../utils/access/AccessRouteConfigStore.js';

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
   * @param {Function|null} setLang - Optional language state setter.
   */
  constructor(
    setPage,
    eventTarget = window,
    hashProvider = () => window.location.hash,
    setHash = null,
    setLang = null,
  ) {
    this.setPage = setPage;
    this.eventTarget = eventTarget;
    this.setHash = setHash;
    this.setLang = setLang;
    this.routeResolver = new HashRouteResolver(hashProvider);
    AccessRouteConfigStore.load();
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
   * @param {string} [lang] - Current language code.
   * @returns {React.ReactElement} Rendered app tree.
   */
  renderPage(page, hash = '', lang = '') {
    return AppHelper.render(page, hash, lang);
  }

  /**
   * Build react effect that listens to hash changes and language changes.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      const handleHashChange = () => {
        this.setPage(this.getPage());
        AccessStore.syncForRoute(this.getPage(), this.routeResolver.currentHash());
        this.setHash?.(this.routeResolver.currentHash());
      };

      const handleLanguageChange = (event) => {
        this.setLang?.(event.detail?.language);
      };

      const handleAuthChange = () => AccessStore.syncForAuthChange();

      AccessStore.syncForRoute(this.getPage(), this.routeResolver.currentHash());
      this.eventTarget.addEventListener('hashchange', handleHashChange);
      LanguageEvents.subscribe(handleLanguageChange);
      AuthEvents.subscribe(handleAuthChange);

      return () => {
        this.eventTarget.removeEventListener('hashchange', handleHashChange);
        LanguageEvents.unsubscribe(handleLanguageChange);
        AuthEvents.unsubscribe(handleAuthChange);
      };
    };
  }
}
