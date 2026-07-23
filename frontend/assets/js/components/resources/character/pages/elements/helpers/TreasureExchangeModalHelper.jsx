import Modal from 'react-bootstrap/cjs/Modal.js';
import OverlayTrigger from 'react-bootstrap/cjs/OverlayTrigger.js';
import Tooltip from 'react-bootstrap/cjs/Tooltip.js';
import TreasureMoney from '../../../../../common/misc/TreasureMoney.jsx';
import Icons from '../../../../../../utils/ui/Icons.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the treasure exchange modal shell: the modal chrome (title, money
 * display, footer close button) and the config-driven tab nav (label plus a help-tooltip badge
 * per tab), delegating the body to whichever tab component (`state.tabs[state.activeTab]`) is
 * currently active.
 */
export default class TreasureExchangeModalHelper {
  /**
   * Renders the treasure exchange modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {object} state - Modal state.
   * @param {string} state.activeTab - Currently active tab key (e.g. `'buy'`/`'sell'`).
   * @param {object} state.tabs - Tab config map (`treasureExchangeTabs.js`-shaped): each entry
   *   declares `labelKey`, `tooltipKey`, and `Component`.
   * @param {object} [state.character] - Character context, forwarded to the active tab.
   * @param {object[]} [state.ownedTreasures] - Currently loaded owned-treasure entries, forwarded
   *   to the active tab.
   * @param {string} [state.gameType] - Currency model name (e.g. `dnd`, `deadlands`).
   * @param {Function} state.onSuccess - Success handler, forwarded to the active tab.
   * @param {object} handlers - Modal event handlers.
   * @param {Function} handlers.onClose - Called when the modal is dismissed.
   * @param {Function} handlers.onTabChange - Called with the new tab key when a tab is clicked.
   * @returns {React.ReactElement} Rendered treasure exchange modal.
   */
  static render(show, state, handlers) {
    const { Component: ActiveTabComponent } = state.tabs[state.activeTab];

    return (
      <Modal show={show} onHide={handlers.onClose}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('treasure_exchange_modal.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {TreasureExchangeModalHelper.#renderMoney(state.character, state.gameType)}
          {TreasureExchangeModalHelper.#renderTabs(state, handlers)}
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
            {Translator.t('treasure_exchange_modal.cancel')}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }

  static #renderMoney(character, gameType) {
    if (!character) {
      return null;
    }

    return (
      <p className="mb-3">
        <strong>{Translator.t('treasure_exchange_modal.your_money')}</strong>
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
