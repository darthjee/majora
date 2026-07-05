import AuthClient from '../../../client/AuthClient.js';
import HealthClient from '../../../client/HealthClient.js';
import AuthEvents from '../../../utils/AuthEvents.js';
import AuthStorage from '../../../utils/AuthStorage.js';
import Translator from '../../../i18n/Translator.js';
import ActivityTracker from '../../../utils/ActivityTracker.js';
import Noop from '../../../utils/Noop.js';
import HashRouteResolver from '../../../utils/HashRouteResolver.js';

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

const ROUTE_PATTERNS = {
  game: '/games/:game_slug',
  pcCharacter: '/games/:game_slug/pcs/:character_id',
  npcCharacter: '/games/:game_slug/npcs/:character_id',
};

const NOOP_EVENT_TARGET = {
  addEventListener: Noop.noop,
  removeEventListener: Noop.noop,
};

/**
 * Returns the global `window` object when available, or a no-op stand-in
 * otherwise (e.g. when running in a non-browser test environment).
 *
 * @returns {EventTarget} the default event target for hash change listening.
 */
function defaultEventTarget() {
  return typeof window === 'undefined' ? NOOP_EVENT_TARGET : window;
}

/**
 * Manages authentication state and modal visibility for the Header element.
 */
export default class HeaderController {
  /**
   * Creates a new HeaderController instance.
   *
   * @param {Function} setLoggedIn - state setter for the logged-in flag.
   * @param {Function} setShowModal - state setter for the login modal visibility.
   * @param {Function} [setTestEmailStatus] - state setter for the test email status.
   * @param {Function} [setIsSuperUser] - state setter for the superuser flag.
   * @param {Function} [setServerStatus] - state setter for the server status ('up'|'down'|null).
   * @param {AuthClient} [client] - HTTP client used for auth requests.
   * @param {HealthClient} [healthClient] - HTTP client used for health-check polling.
   * @param {Function} [setIsStaff] - state setter for the staff flag.
   * @param {Function} [setRoute] - state setter for the current route info.
   * @param {HashRouteResolver} [routeResolver] - resolver used to derive the current route.
   * @param {EventTarget} [eventTarget] - target used to listen for hash changes.
   */
  constructor(
    setLoggedIn,
    setShowModal,
    setTestEmailStatus = Noop.noop,
    setIsSuperUser = Noop.noop,
    setServerStatus = Noop.noop,
    client = new AuthClient(),
    healthClient = new HealthClient(),
    setIsStaff = Noop.noop,
    setRoute = Noop.noop,
    routeResolver = new HashRouteResolver(),
    eventTarget = defaultEventTarget()
  ) {
    this.setLoggedIn = setLoggedIn;
    this.setShowModal = setShowModal;
    this.setTestEmailStatus = setTestEmailStatus;
    this.setIsSuperUser = setIsSuperUser;
    this.setServerStatus = setServerStatus;
    this.client = client;
    this.healthClient = healthClient;
    this.setIsStaff = setIsStaff;
    this.setRoute = setRoute;
    this.routeResolver = routeResolver;
    this.eventTarget = eventTarget;
    this.healthIntervalId = null;
  }

  /**
   * Resolves the current route (page identifier and its params) using the
   * injected route resolver.
   *
   * @returns {{page: string, gameSlug: (string|undefined), characterId: (string|undefined)}} current route info.
   */
  getRoute() {
    const page = this.routeResolver.getPage();
    const pattern = ROUTE_PATTERNS[page];

    if (!pattern) {
      return { page };
    }

    const params = this.routeResolver.getParams(pattern);

    return { page, gameSlug: params.game_slug, characterId: params.character_id };
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
   * Starts polling the health-check endpoint at the given interval.
   * Skips the request when the user has been idle for more than 30 minutes.
   *
   * @description Stores the interval ID so it can be cancelled later via stopHealthCheck.
   * @param {number} [intervalMs=60000] - Polling interval in milliseconds.
   * @returns {void}
   */
  startHealthCheck(intervalMs = 60000) {
    this.healthIntervalId = setInterval(async () => {
      const lastActivity = ActivityTracker.getLastActivity();

      if (lastActivity === null || Date.now() - lastActivity > THIRTY_MINUTES_MS) {
        return;
      }

      try {
        const response = await this.healthClient.check();

        if (response.status === 502) {
          this.setServerStatus('down');
        } else {
          this.setServerStatus('up');
        }
      } catch {
        this.setServerStatus('down');
      }
    }, intervalMs);
  }

  /**
   * Stops the health-check polling interval.
   *
   * @description Clears the interval started by startHealthCheck.
   * @returns {void}
   */
  stopHealthCheck() {
    clearInterval(this.healthIntervalId);
  }

  /**
   * Checks the current authentication status using the stored token,
   * updates local state, and emits the result.
   *
   * @returns {Promise<void>} resolves when the status check finishes.
   */
  async checkStatus() {
    try {
      const response = await this.client.status(AuthStorage.getToken());

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (data.token) {
        AuthStorage.setToken(data.token);
      }

      this.setLoggedIn(Boolean(data.logged_in));
      this.setIsSuperUser(Boolean(data.is_superuser));
      this.setIsStaff(Boolean(data.is_staff));
      AuthEvents.emit(Boolean(data.logged_in));
      this.#applyLanguagePreference(data);
    } catch {
      // Ignore status check failures; default unauthenticated state remains.
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
}
