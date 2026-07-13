import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LoginModal from '../../../../../assets/js/components/common/LoginModal.jsx';
import LoginModalHelper from '../../../../../assets/js/components/common/helpers/LoginModalHelper.jsx';

describe('LoginModal', function() {
  describe('#render', function() {
    it('passes the default state to the helper', function() {
      spyOn(LoginModalHelper, 'render').and.returnValue(React.createElement('div', null, 'modal'));

      const html = renderToStaticMarkup(
        React.createElement(LoginModal, {
          show: true,
          onClose: jasmine.createSpy('onClose'),
          onSuccess: jasmine.createSpy('onSuccess'),
        })
      );

      expect(html).toContain('modal');
      expect(LoginModalHelper.render).toHaveBeenCalledWith(
        true,
        {
          username: '',
          password: '',
          incorrect: false,
          error: false,
          mode: 'login',
          email: '',
          recoverySent: false,
        },
        jasmine.objectContaining({
          onClose: jasmine.any(Function),
          onCancel: jasmine.any(Function),
          onSubmit: jasmine.any(Function),
          onUsernameChange: jasmine.any(Function),
          onPasswordChange: jasmine.any(Function),
          onForgotPasswordClick: jasmine.any(Function),
          onRegisterClick: jasmine.any(Function),
          onBackToLoginClick: jasmine.any(Function),
          onEmailChange: jasmine.any(Function),
          onRecoverSubmit: jasmine.any(Function),
        })
      );
    });

    it('navigates to the register page and closes the modal when registering', function() {
      const onClose = jasmine.createSpy('onClose');
      let capturedHandlers;
      const fakeWindow = { location: { hash: '' } };

      spyOn(LoginModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return React.createElement('div', null, 'modal');
      });

      renderToStaticMarkup(
        React.createElement(LoginModal, {
          show: true,
          onClose,
          onSuccess: jasmine.createSpy('onSuccess'),
        })
      );

      globalThis.window = fakeWindow;

      try {
        capturedHandlers.onRegisterClick();

        expect(onClose).toHaveBeenCalled();
        expect(fakeWindow.location.hash).toBe('/users/register');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
