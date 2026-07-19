import React from 'react';
import CardHoverTooltip from '../../../../common/cards/CardHoverTooltip.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import Icons from '../../../../../utils/ui/Icons.js';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the staff dashboard page.
 */
export default class StaffDashboardHelper {
  /**
   * Render the dashboard card with the clear-cache button.
   *
   * @param {string} status - Clear-cache action status (`idle`, `loading`, `success`, or `error`).
   * @param {{onClearCache: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Staff dashboard page element.
   */
  static render(status, handlers) {
    return (
      <div className="container mt-4">
        <PageActions backHref="#/" />
        <h1>{Translator.t('staff_dashboard.title')}</h1>
        <div className="row">
          <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
            <CardHoverTooltip content={Translator.t('staff_dashboard.clear_cache_tooltip')}>
              <button
                type="button"
                className="card h-100 w-100 border-0 bg-transparent text-center py-4"
                disabled={status === 'loading'}
                onClick={handlers.onClearCache}
              >
                <i className={`bi ${Icons.databaseFillDash} display-4`} aria-hidden="true"></i>
              </button>
            </CardHoverTooltip>
          </div>
        </div>
        {StaffDashboardHelper.#renderFeedback(status)}
      </div>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('staff_dashboard.loading')} />;
  }

  /**
   * Render the error state.
   *
   * @param {string} error - Error message.
   * @returns {React.ReactElement} Error alert.
   */
  static renderError(error) {
    return <ErrorAlert error={error} />;
  }

  /**
   * Render the success/error feedback message for the clear-cache action, when applicable.
   *
   * @param {string} status - Clear-cache action status (`idle`, `loading`, `success`, or `error`).
   * @returns {React.ReactElement|null} Feedback message, or `null` when there is nothing to show.
   */
  static #renderFeedback(status) {
    if (status === 'success') {
      return <p className="text-success">{Translator.t('staff_dashboard.clear_cache_success')}</p>;
    }

    if (status === 'error') {
      return <p className="text-danger">{Translator.t('staff_dashboard.clear_cache_error')}</p>;
    }

    return null;
  }
}
