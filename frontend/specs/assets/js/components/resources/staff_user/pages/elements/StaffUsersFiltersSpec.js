import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffUsersFilters
  from '../../../../../../../../assets/js/components/resources/staff_user/pages/elements/StaffUsersFilters.jsx';
import StaffUsersFiltersHelper
  from '../../../../../../../../assets/js/components/resources/staff_user/pages/elements/helpers/StaffUsersFiltersHelper.jsx';

describe('StaffUsersFilters', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  const captureHandlers = () => {
    let captured;
    spyOn(StaffUsersFiltersHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return React.createElement('div', null, 'filters');
    });
    return () => captured;
  };

  it('renders blank draft fields when the hash has no filter params', function() {
    globalThis.window = { location: { hash: '#/staff/users' } };
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(StaffUsersFilters, { onQuery: jasmine.createSpy(), onClear: jasmine.createSpy() }),
    );

    expect(getCaptured().state).toEqual({ status: '', search: '' });
  });

  it('pre-populates draft fields from the hash query params (deep link)', function() {
    globalThis.window = { location: { hash: '#/staff/users?status=pending&search=jane' } };
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(StaffUsersFilters, { onQuery: jasmine.createSpy(), onClear: jasmine.createSpy() }),
    );

    expect(getCaptured().state).toEqual({ status: 'pending', search: 'jane' });
  });

  it('calls onQuery with the built query when the Query handler runs', function() {
    globalThis.window = { location: { hash: '#/staff/users?status=pending&search=jane' } };
    const onQuery = jasmine.createSpy('onQuery');
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(StaffUsersFilters, { onQuery, onClear: jasmine.createSpy() }),
    );
    getCaptured().handlers.onQuery();

    expect(onQuery).toHaveBeenCalledWith({ status: 'pending', search: 'jane' });
  });

  it('calls onClear when the Clear handler runs', function() {
    globalThis.window = { location: { hash: '#/staff/users?status=pending' } };
    const onClear = jasmine.createSpy('onClear');
    const getCaptured = captureHandlers();

    renderToStaticMarkup(
      React.createElement(StaffUsersFilters, { onQuery: jasmine.createSpy(), onClear }),
    );
    getCaptured().handlers.onClear();

    expect(onClear).toHaveBeenCalled();
  });
});
