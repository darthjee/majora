import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Register from '../../../../../../../assets/js/components/resources/account/pages/Register.jsx';
import RegisterHelper from '../../../../../../../assets/js/components/resources/account/pages/helpers/RegisterHelper.jsx';

describe('Register', function() {
  describe('#render', function() {
    it('passes the default state to the helper', function() {
      spyOn(RegisterHelper, 'render').and.returnValue(React.createElement('div', null, 'register'));

      const html = renderToStaticMarkup(React.createElement(Register));

      expect(html).toContain('register');
      expect(RegisterHelper.render).toHaveBeenCalledWith(
        {
          name: '',
          displayName: '',
          email: '',
          password: '',
          passwordConfirmation: '',
          status: 'idle',
        },
        jasmine.objectContaining({
          onSubmit: jasmine.any(Function),
          onNameChange: jasmine.any(Function),
          onDisplayNameChange: jasmine.any(Function),
          onEmailChange: jasmine.any(Function),
          onPasswordChange: jasmine.any(Function),
          onPasswordConfirmationChange: jasmine.any(Function),
        })
      );
    });
  });
});
