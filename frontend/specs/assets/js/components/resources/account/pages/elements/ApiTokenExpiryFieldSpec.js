import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ApiTokenExpiryField from '../../../../../../../../assets/js/components/resources/account/pages/elements/ApiTokenExpiryField.jsx';
import ApiTokenExpiryFieldHelper from '../../../../../../../../assets/js/components/resources/account/pages/elements/helpers/ApiTokenExpiryFieldHelper.jsx';
import ApiTokenExpiry from '../../../../../../../../assets/js/components/resources/account/pages/elements/ApiTokenExpiry.js';

describe('ApiTokenExpiryField', function() {
  let state;
  let handlers;
  const onChange = jasmine.createSpy('onChange');
  const value = { choice: '90', customDate: '' };

  beforeEach(function() {
    spyOn(ApiTokenExpiryFieldHelper, 'render').and.callFake((s, h) => {
      state = s;
      handlers = h;
      return React.createElement('div');
    });
    renderToStaticMarkup(React.createElement(ApiTokenExpiryField, { value, onChange }));
  });

  it('passes the value, tomorrow as min date and no errors', function() {
    expect(state).toEqual({ value, minDate: ApiTokenExpiry.minDate(), errors: [] });
  });

  it('changes the choice', function() {
    handlers.onChoiceChange('custom');

    expect(onChange).toHaveBeenCalledWith({ choice: 'custom', customDate: '' });
  });

  it('changes the custom date', function() {
    handlers.onDateChange('2030-01-01');

    expect(onChange).toHaveBeenCalledWith({ choice: '90', customDate: '2030-01-01' });
  });
});
