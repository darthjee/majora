import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffStatisticsAccessGate
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsAccessGate.jsx';
import StaffStatisticsPageController
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/StaffStatisticsPageController.js';
import AccessStore from '../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { stubBuildEffect } from '../../../../../../../support/controllerStubs.js';

describe('StaffStatisticsAccessGate', function() {
  const render = () => renderToStaticMarkup(
    React.createElement(StaffStatisticsAccessGate, null, React.createElement('p', null, 'secret')),
  );

  beforeEach(function() {
    stubBuildEffect(StaffStatisticsPageController);
  });

  it('renders nothing until access is confirmed', function() {
    spyOn(AccessStore, 'isStaffOrSuperUser').and.returnValue(false);

    expect(render()).toBe('');
  });

  it('renders the children when access is already known', function() {
    spyOn(AccessStore, 'isStaffOrSuperUser').and.returnValue(true);

    expect(render()).toBe('<p>secret</p>');
  });
});
