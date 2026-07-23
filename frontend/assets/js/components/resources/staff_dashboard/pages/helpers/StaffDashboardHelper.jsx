import React from 'react';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import Translator from '../../../../../i18n/Translator.js';
import dashboardCardConfig from '../dashboardCardConfig.js';

/**
 * Rendering helper for the staff dashboard page.
 */
export default class StaffDashboardHelper {
  /**
   * Render the config-driven grid of dashboard cards, 4 per row.
   *
   * @returns {React.ReactElement} Staff dashboard page element.
   */
  static render() {
    return (
      <div className="container mt-4">
        <PageActions backHref="#/" />
        <h1>{Translator.t('staff_dashboard.title')}</h1>
        <div className="row">
          {dashboardCardConfig.map(({ key, Component }) => (
            <div className="col-6 col-sm-4 col-md-3 col-lg-3 mb-4" key={key}>
              <Component />
            </div>
          ))}
        </div>
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
}
