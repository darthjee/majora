import AuthClient from '../../../../client/AuthClient.js';
import DomainClient from '../../../../client/DomainClient.js';
import AuthEvents from '../../../../utils/auth/AuthEvents.js';
import AuthStorage from '../../../../utils/auth/AuthStorage.js';
import Translator from '../../../../i18n/Translator.js';
import Noop from '../../../../utils/Noop.js';
import HashRouteResolver from '../../../../utils/routing/HashRouteResolver.js';
import HeaderRouteResolver from './HeaderRouteResolver.js';

const NOOP_EVENT_TARGET = {
  addEventListener: Noop.noop,
  removeEventListener: Noop.noop,
};

/**
 * Manages authentication state and modal visibility for the Header element.
 */
export default class HeaderController {
  /**
   * Returns the global `window` object when available, or a no-op stand-in
   * otherwise (e.g. when running in a non-browser test environment).
   *
   * @returns {EventTarget} the default event target for hash change listening.
   */
  static #defaultEventTarget() {
    return typeof window === 'undefined' ? NOOP_EVENT_TARGET : window;
  }

  /**
   * Creates a new HeaderController instance.
   *
   * @param {Function} setLoggedIn - state setter for the logged-in flag.
   * @param {Function} setShowModal - state setter for the login modal visibility.
   * @param {Function} [setTestEmailStatus] - state setter for the test email status.
   * @param {Function} [setIsSuperUser] - state setter for the superuser flag.
   * @param {AuthClient} [client] - HTTP client used for auth requests.
   * @param {Function} [setIsStaff] - state setter for the staff flag.
   * @param {Function} [setRoute] - state setter for the current route info.
   * @param {HashRouteResolver} [routeResolver] - resolver used to derive the current route.
   * @param {EventTarget} [eventTarget] - target used to listen for hash changes.
   * @param {Function} [setPendingApproval] - state setter for the "awaiting approval" flag
   *   (issue #859), from `GET /users/header_status.json`'s `status: 'pending'` case. Left undefined
   *   by default (unlike every other setter above) to keep this constructor's complexity at the
   *   project's limit; `#checkStatus` calls it defensively via optional chaining instead.
   * @param {DomainClient} [domainClient] - HTTP client used for the domain-configuration request.
   * @param {Function} [setDomainConfig] - state setter for the resolved `{favicon, title,
   *   subTitle}` domain configuration (issue #759). Left undefined by default, same reasoning
   *   as `setPendingApproval`; `fetchDomainConfig` calls it defensively via optional chaining.
   */
  constructor(
    setLoggedIn,
    setShowModal,
    setTestEmailStatus = Noop.noop,
    setIsSuperUser = Noop.noop,
    client = new AuthClient(),
    setIsStaff = Noop.noop,
    setRoute = Noop.noop,
    routeResolver = new HashRouteResolver(),
    eventTarget = HeaderController.#defaultEventTarget(),
    setPendingApproval,
    domainClient = new DomainClient(),
    setDomainConfig
  ) {
    this.setLoggedIn = setLoggedIn;
    this.setShowModal = setShowModal;
    this.setTestEmailStatus = setTestEmailStatus;
    this.setIsSuperUser = setIsSuperUser;
    this.client = client;
    this.setIsStaff = setIsStaff;
    this.setRoute = setRoute;
    this.routeResolver = routeResolver;
    this.eventTarget = eventTarget;
    this.setPendingApproval = setPendingApproval;
    this.domainClient = domainClient;
    this.setDomainConfig = setDomainConfig;
  }

  /**
   * Resolves the current route (page identifier and its params) using the
   * injected route resolver.
   *
   * @returns {{page: string, gameSlug: (string|undefined), characterId: (string|undefined)}} current route info.
   */
  getRoute() {
    return HeaderRouteResolver.resolve(this.routeResolver);
  }

  /**
   * Builds the effect used to keep the current route in sync with hash changes.
   *
   * @description Mirrors AppController#buildEffect: returns a start function that
   *   subscribes to hashchange events and returns a cleanup function.
   * @returns {Function} Effect callback returning a cleanup function.
   */
  buildRouteEffect() {
    return () => {
      const handleHashChange = () => {
        this.setRoute(this.getRoute());
      };

      this.eventTarget.addEventListener('hashchange', handleHashChange);

      return () => {
        this.eventTarget.removeEventListener('hashchange', handleHashChange);
      };
    };
  }

  /**
   * Checks the current authentication status using the stored token, via the
   * header-scoped endpoint (`AuthClient#headerStatus`), updates local state,
   * and emits the result.
   *
   * @returns {Promise<{isSuperUser: boolean, isStaff: boolean}>} resolves with the
   *   resolved `isSuperUser`/`isStaff` flags once the status check finishes (or the
   *   fail-closed defaults, when the check fails), for callers deriving `canViewAs`.
   */
  async checkStatus() {
    try {
      const response = await this.client.headerStatus(AuthStorage.getToken());

      if (!response.ok) {
        return HeaderController.#defaultAdminFlags();
      }

      const data = await response.json();

      if (data.token) {
        AuthStorage.setToken(data.token);
      }

      if (data.cache_token) {
        AuthStorage.setCacheToken(data.cache_token);
      }

      const isSuperUser = Boolean(data.is_superuser);
      const isStaff = Boolean(data.is_staff);

      this.setLoggedIn(Boolean(data.logged_in));
      this.setIsSuperUser(isSuperUser);
      this.setIsStaff(isStaff);
      this.setPendingApproval?.(Boolean(data.status === 'pending'));
      AuthEvents.emit(Boolean(data.logged_in));
      this.#applyLanguagePreference(data);

      return { isSuperUser, isStaff };
    } catch {
      // Ignore status check failures; default unauthenticated state remains.
      return HeaderController.#defaultAdminFlags();
    }
  }

  /**
   * Applies the favorite language preference from a status response, when
   * present and different from the current translator language.
   *
   * @param {{settings: ({favorite_language: string}|undefined)}} data - status response payload.
   * @returns {void}
   */
  #applyLanguagePreference(data) {
    const favoriteLanguage = data.settings?.favorite_language;

    if (favoriteLanguage && favoriteLanguage !== Translator.getLanguage()) {
      Translator.setLanguage(favoriteLanguage);
    }
  }

  /**
   * Fail-closed default admin flags, returned by {@link checkStatus} whenever
   * the status check does not resolve a real response (non-OK or thrown).
   *
   * @returns {{isSuperUser: boolean, isStaff: boolean}} both flags, false.
   */
  static #defaultAdminFlags() {
    return { isSuperUser: false, isStaff: false };
  }

  /**
   * Fetches the current domain group's configuration (favicon/title/sub-title
   * overrides, resolved server-side from the request's host) and stores the
   * resolved values via `setDomainConfig`. Failures (non-OK response or a
   * thrown error) are swallowed silently, leaving the header's already-set
   * defaults untouched.
   *
   * @returns {Promise<void>} resolves once the request settles.
   */
  async fetchDomainConfig() {
    try {
      const response = await this.domainClient.config();

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      this.setDomainConfig?.({
        favicon: data.favicon ?? null,
        title: data.title,
        subTitle: data.sub_title,
      });
    } catch {
      // Ignore domain config fetch failures; header keeps its default title/sub-title.
    }
  }

  /**
   * Prevents the default link navigation for the "view as" link and
   * delegates to the given view-as click handler.
   *
   * @param {Event} event - DOM click event from the view-as link.
   * @param {Function} onViewAsClick - View-as click handler to invoke after preventing default.
   * @returns {void}
   */
  handleViewAsClick(event, onViewAsClick) {
    event.preventDefault();
    onViewAsClick();
  }

  /**
   * Opens the login modal.
   *
   * @returns {void}
   */
  handleLoginClick() {
    this.setShowModal(true);
  }

  /**
   * Logs the current user out, clearing the stored token and emitting
   * the resulting auth state.
   *
   * @returns {Promise<void>} resolves when the logout request finishes.
   */
  async handleLogoffClick() {
    const token = AuthStorage.getToken();

    try {
      await this.client.logout(token);
    } catch {
      // Ignore logout request failures; local auth state is cleared regardless.
    } finally {
      AuthStorage.clearToken();
      AuthStorage.clearCacheToken();
      this.setLoggedIn(false);
      AuthEvents.emit(false);
    }
  }

  /**
   * Closes the login modal.
   *
   * @returns {void}
   */
  handleModalClose() {
    this.setShowModal(false);
  }

  /**
   * Handles a successful login by marking the user logged in and closing the modal.
   *
   * @returns {void}
   */
  handleLoginSuccess() {
    this.setLoggedIn(true);
    this.setShowModal(false);
  }

  /**
   * Sends a test email for the currently authenticated user, updating
   * the test email status state with the outcome.
   *
   * @returns {Promise<void>} resolves when the test email request finishes.
   */
  async handleSendTestEmailClick() {
    try {
      const response = await this.client.sendTestEmail(AuthStorage.getToken());

      this.setTestEmailStatus(response.ok ? 'sent' : 'error');
    } catch {
      this.setTestEmailStatus('error');
    }
  }

  /**
   * Re-runs the auth status and "view as" availability checks, so admin/staff/
   * ViewAs state is recomputed after a genuine auth transition (e.g. an
   * in-app login/logout) instead of staying stuck at its mount-time value.
   *
   * @param {HeaderViewAsController} viewAsController - controller whose
   *   checkAvailability() should be re-run alongside checkStatus().
   * @returns {Promise<void>} resolves when both checks settle.
   */
  async recheckAuthState(viewAsController) {
    const { isSuperUser, isStaff } = await this.checkStatus();

    await viewAsController.checkAvailability(isSuperUser, isStaff);
  }

  /**
   * Persists the given language as the user's favorite when logged in.
   *
   * @param {string} language - the newly selected language code.
   * @param {boolean} loggedIn - whether the user is currently logged in.
   * @returns {Promise<void>} resolves when the request finishes, if any.
   */
  async handleLanguageChange(language, loggedIn) {
    if (!loggedIn) {
      return;
    }

    try {
      await this.client.setLanguagePreference(AuthStorage.getToken(), language);
    } catch {
      // Ignore failures persisting the language preference.
    }
  }

  /**
   * Builds the handlers object passed to `HeaderHelper.render`, wrapping every
   * user-interaction callback used by the header's markup so `Header.jsx` doesn't
   * need to build this object inline.
   *
   * @param {HeaderViewAsController} viewAsController - controller backing the
   *   "view as" click/modal-close handlers.
   * @param {boolean} loggedIn - current logged-in value, forwarded to
   *   `handleLanguageChange`.
   * @returns {{onLoginClick: Function, onLogoffClick: Function, onModalClose: Function,
   *   onLoginSuccess: Function, onSendTestEmailClick: Function, onLanguageChange: Function,
   *   onViewAsClick: Function, onViewAsModalClose: Function}} handlers consumed by
   *   `HeaderHelper.render`.
   */
  buildHandlers(viewAsController, loggedIn) {
    return {
      onLoginClick: () => this.handleLoginClick(),
      onLogoffClick: () => this.handleLogoffClick(),
      onModalClose: () => this.handleModalClose(),
      onLoginSuccess: () => this.handleLoginSuccess(),
      onSendTestEmailClick: () => this.handleSendTestEmailClick(),
      onLanguageChange: (language) => this.handleLanguageChange(language, loggedIn),
      onViewAsClick: (event) => this.handleViewAsClick(
        event, () => viewAsController.handleViewAsClick(),
      ),
      onViewAsModalClose: () => viewAsController.handleViewAsModalClose(),
    };
  }
}
