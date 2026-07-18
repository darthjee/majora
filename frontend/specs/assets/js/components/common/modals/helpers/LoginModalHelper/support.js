export const buildHandlers = () => ({
  onClose: jasmine.createSpy('onClose'),
  onCancel: jasmine.createSpy('onCancel'),
  onSubmit: jasmine.createSpy('onSubmit'),
  onUsernameChange: jasmine.createSpy('onUsernameChange'),
  onPasswordChange: jasmine.createSpy('onPasswordChange'),
  onForgotPasswordClick: jasmine.createSpy('onForgotPasswordClick'),
  onRegisterClick: jasmine.createSpy('onRegisterClick'),
  onBackToLoginClick: jasmine.createSpy('onBackToLoginClick'),
  onEmailChange: jasmine.createSpy('onEmailChange'),
  onRecoverSubmit: jasmine.createSpy('onRecoverSubmit'),
});

export const buildState = (overrides = {}) => ({
  username: '',
  password: '',
  incorrect: false,
  error: false,
  mode: 'login',
  email: '',
  recoverySent: false,
  ...overrides,
});

export const findElement = (node, matcher) => {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, matcher);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (typeof node !== 'object') {
    return null;
  }

  if (matcher(node)) {
    return node;
  }

  return findElement(node.props?.children, matcher);
};
