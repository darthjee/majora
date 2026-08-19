import Translator from '../../../../../../assets/js/i18n/Translator.js';
import { runCases } from './support.js';

const CASES = [
  { page: 'recoverPassword', hash: '#/recover-password', expected: 'Reset password' },
  { page: 'register', hash: '#/users/register', expected: 'Register' },
  { page: 'staffUsers', hash: '#/staff/users', expected: () => Translator.t('staff_users_page.loading') },
  { page: 'staffUser', hash: '#/staff/users/1', expected: () => Translator.t('staff_user_page.loading') },
  { page: 'staffUserEdit', hash: '#/staff/users/1/edit', expected: () => Translator.t('staff_user_page.loading') },
  { page: 'myAccount', hash: '#/my_account', expected: () => Translator.t('my_account_page.loading') },
  {
    page: 'accountAuthorizationRequests',
    hash: '#/account/authorization_requests',
    expected: () => Translator.t('authorization_requests_page.loading'),
  },
];

describe('AppHelper', function() {
  runCases(CASES);
});
