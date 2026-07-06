import { renderToStaticMarkup } from 'react-dom/server';
import HeaderHelper from '../../../../../../../assets/js/components/elements/helpers/HeaderHelper.jsx';

export const buildHandlers = () => ({
  onLoginClick: jasmine.createSpy('onLoginClick'),
  onLogoffClick: jasmine.createSpy('onLogoffClick'),
  onModalClose: jasmine.createSpy('onModalClose'),
  onLoginSuccess: jasmine.createSpy('onLoginSuccess'),
  onSendTestEmailClick: jasmine.createSpy('onSendTestEmailClick'),
  onLanguageChange: jasmine.createSpy('onLanguageChange'),
});

export const buildState = (overrides = {}) => ({
  loggedIn: false,
  showModal: false,
  testEmailStatus: null,
  isSuperUser: false,
  serverStatus: null,
  isStaff: false,
  route: { page: 'home' },
  ...overrides,
});

export const render = (overrides = {}, handlers = buildHandlers()) => renderToStaticMarkup(
  HeaderHelper.render(buildState(overrides), handlers)
);
