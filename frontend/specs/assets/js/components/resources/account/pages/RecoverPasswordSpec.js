import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RecoverPassword from '../../../../../../../assets/js/components/resources/account/pages/RecoverPassword.jsx';
import RecoverPasswordHelper from '../../../../../../../assets/js/components/resources/account/pages/helpers/RecoverPasswordHelper.jsx';
import RecoverPasswordController
  from '../../../../../../../assets/js/components/resources/account/pages/controllers/RecoverPasswordController.js';

describe('RecoverPassword', function() {
  describe('#render', function() {
    it('passes the default state to the helper, not ready yet', function() {
      spyOn(RecoverPasswordController.prototype, 'waitUntilReady');
      spyOn(RecoverPasswordHelper, 'render').and.returnValue(React.createElement('div', null, 'recover-password'));

      const html = renderToStaticMarkup(React.createElement(RecoverPassword));

      expect(html).toContain('recover-password');
      expect(RecoverPasswordHelper.render).toHaveBeenCalledWith(
        {
          password: '',
          confirmPassword: '',
          status: 'idle',
          errorMessage: '',
          ready: false,
        },
        jasmine.objectContaining({
          onSubmit: jasmine.any(Function),
          onPasswordChange: jasmine.any(Function),
          onConfirmPasswordChange: jasmine.any(Function),
        })
      );
    });
  });
});
