import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffDashboard from '../../../../../../../assets/js/components/resources/staff_dashboard/pages/StaffDashboard.jsx';
import StaffDashboardHelper from '../../../../../../../assets/js/components/resources/staff_dashboard/pages/helpers/StaffDashboardHelper.jsx';
import StaffDashboardController from '../../../../../../../assets/js/components/resources/staff_dashboard/pages/controllers/StaffDashboardController.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';

describe('StaffDashboard', function() {
  it('renders the loading state while checking access', function() {
    stubBuildEffect(StaffDashboardController);
    stubRenderLoading(StaffDashboardHelper);

    const html = renderToStaticMarkup(React.createElement(StaffDashboard));

    expect(html).toContain('loading');
  });

  it('renders the dashboard card via StaffDashboardHelper.render', function() {
    stubBuildEffect(StaffDashboardController);

    const html = renderToStaticMarkup(
      StaffDashboardHelper.render('idle', { onClearCache: Noop.noop })
    );

    expect(html).toContain('bi-database-fill-dash');
  });
});
