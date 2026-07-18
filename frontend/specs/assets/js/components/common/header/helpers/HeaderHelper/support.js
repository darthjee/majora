import { renderToStaticMarkup } from 'react-dom/server';
import HeaderHelper from '../../../../../../../../assets/js/components/common/header/helpers/HeaderHelper.jsx';

export const buildHandlers = () => ({
  onLoginClick: jasmine.createSpy('onLoginClick'),
  onLogoffClick: jasmine.createSpy('onLogoffClick'),
  onModalClose: jasmine.createSpy('onModalClose'),
  onLoginSuccess: jasmine.createSpy('onLoginSuccess'),
  onSendTestEmailClick: jasmine.createSpy('onSendTestEmailClick'),
  onLanguageChange: jasmine.createSpy('onLanguageChange'),
  onViewAsClick: jasmine.createSpy('onViewAsClick'),
  onViewAsModalClose: jasmine.createSpy('onViewAsModalClose'),
});

export const buildState = (overrides = {}) => ({
  loggedIn: false,
  showModal: false,
  testEmailStatus: null,
  isSuperUser: false,
  serverStatus: null,
  isStaff: false,
  route: { page: 'home' },
  gameAccess: undefined,
  canViewAs: false,
  showViewAsModal: false,
  facadeEnabled: false,
  ...overrides,
});

export const render = (overrides = {}, handlers = buildHandlers()) => renderToStaticMarkup(
  HeaderHelper.render(buildState(overrides), handlers)
);
