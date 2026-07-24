import Modal from 'react-bootstrap/cjs/Modal.js';
import OverlayTrigger from 'react-bootstrap/cjs/OverlayTrigger.js';
import Tooltip from 'react-bootstrap/cjs/Tooltip.js';
import TreasureMoney from '../../../../../common/misc/TreasureMoney.jsx';
import Icons from '../../../../../../utils/ui/Icons.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the resource exchange modal shell: the modal chrome (title, optional money
 * display, footer close button) and the config-driven tab nav (label plus a help-tooltip badge
 * per tab), delegating the body to whichever tab component (`state.tabs[state.activeTab]`) is
 * currently active. The i18n namespace for the shell's own copy (title, money label, cancel
 * button) is derived from the tabs config itself — every entry's `labelKey`/`tooltipKey` shares
 * the same `<namespace>.xxx` prefix (e.g. `treasure_exchange_modal.*`/`item_exchange_modal.*`),
 * so the shell never needs a namespace prop of its own.
 */
export default class ResourceExchangeModalHelper {
  /**
   * Renders the resource exchange modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {object} state - Modal state.
   * @param {string} state.activeTab - Currently active tab key (e.g. `'buy'`/`'sell'`/`'acquire'`).
   * @param {object} state.tabs - Tab config map (e.g. `treasureExchangeTabs.js`/
   *   `itemExchangeTabs.js`-shaped): each entry declares `labelKey`, `tooltipKey`, and `Component`.
   * @param {object} [state.character] - Character context, forwarded to the active tab.
   * @param {object[]} [state.ownedTreasures] - Currently loaded owned-treasure entries, forwarded
   *   to the active tab.
   * @param {string} [state.gameType] - Currency model name (e.g. `dnd`, `deadlands`).
   * @param {Function} state.onSuccess - Success handler, forwarded to the active tab.
   * @param {object} handlers - Modal event handlers.
   * @param {Function} handlers.onClose - Called when the modal is dismissed.
   * @param {Function} handlers.onTabChange - Called with the new tab key when a tab is clicked.
   * @returns {React.ReactElement} Rendered resource exchange modal.
   */
  static render(show, state, handlers) {
    const { Component: ActiveTabComponent } = state.tabs[state.activeTab];
    const namespace = ResourceExchangeModalHelper.#namespace(state.tabs);

    return (
      <Modal show={show} onHide={handlers.onClose}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t(`${namespace}.title`)}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {ResourceExchangeModalHelper.#renderMoney(namespace, state.character, state.gameType)}
          {ResourceExchangeModalHelper.#renderTabs(state, handlers)}
          <ActiveTabComponent
            show={show}
            character={state.character}
            ownedTreasures={state.ownedTreasures}
            gameType={state.gameType}
            onSuccess={state.onSuccess}
          />
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary" onClick={handlers.onClose}>
            {Translator.t(`${namespace}.cancel`)}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }

  static #namespace(tabs) {
    const [firstTab] = Object.values(tabs);
    return firstTab.labelKey.split('.')[0];
  }

  static #renderMoney(namespace, character, gameType) {
    if (!character || namespace !== 'treasure_exchange_modal') {
      return null;
    }

    return (
      <p className="mb-3">
        <strong>{Translator.t(`${namespace}.your_money`)}</strong>
        {' '}
        <TreasureMoney value={character.money} gameType={gameType} />
      </p>
    );
  }

  static #renderTabs(state, handlers) {
    return (
      <ul className="nav nav-tabs mb-3">
        {Object.entries(state.tabs).map(([tab, config]) => (
          <li className="nav-item" key={tab}>
            <button
              type="button"
              className={`nav-link ${state.activeTab === tab ? 'active' : ''}`}
              onClick={() => handlers.onTabChange(tab)}
            >
              {Translator.t(config.labelKey)}
              {' '}
              <OverlayTrigger placement="top" overlay={<Tooltip>{Translator.t(config.tooltipKey)}</Tooltip>}>
                <span className="d-inline-block">
                  <i className={`bi ${Icons.questionCircleFill}`}></i>
                </span>
              </OverlayTrigger>
            </button>
          </li>
        ))}
      </ul>
    );
  }
}
