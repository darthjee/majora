# Panel controller (independent fetch)

New `StaffUserRecoveryTokensController`, alongside the existing `StaffUserController.js`, owning only the token panel's own `loading`/`error`/`data` state — decoupled from the page's user fetch so a token-fetch failure never blanks the name/email/status block.

```js
// frontend/assets/js/components/resources/staff_user/pages/controllers/StaffUserRecoveryTokensController.js
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

export default class StaffUserRecoveryTokensController extends BasePageController {
  constructor(setTokens, setLoading, setError) {
    super();
    this.setTokens = setTokens;
    this.setLoading = setLoading;
    this.setError = setError;
  }

  buildEffect(userId) {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);

      RequestStore.ensure({
        componentName: 'StaffUserRecoveryTokensController',
        resource: 'staffUser',
        quantityType: 'recoveryTokens',
        params: { id: userId },
      })
        .then(({ data }) => safeSet(this.setTokens, Array.isArray(data) ? data : []))
        .catch(() => safeSet(this.setError, true))
        .finally(() => safeSet(this.setLoading, false));

      return () => {
        mounted = false;
      };
    };
  }
}
```

No `AccessStore.ensureStaffOrSuperUser()` re-check here — `StaffUser.jsx`'s own `StaffUserController` already redirects non-staff/non-superusers away before the page (and this panel) ever mounts.

## Files to Change

- `frontend/assets/js/components/resources/staff_user/pages/controllers/StaffUserRecoveryTokensController.js` — new.
