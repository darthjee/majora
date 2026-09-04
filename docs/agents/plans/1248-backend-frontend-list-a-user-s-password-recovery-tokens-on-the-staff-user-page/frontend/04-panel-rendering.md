# Panel rendering (StaffUserHelper + StaffUser.jsx)

Wire the new controller into `StaffUser.jsx` as a second, independent `useState`/`useEffect` pair alongside the existing user-fetch state, and implement `StaffUserHelper.#renderRecoveryTokenPanel()` (currently returns `null`) as the token table + empty state.

**`StaffUser.jsx`** — add `tokens`/`tokensLoading`/`tokensError` state and a second controller/effect, independent of the `loading`/`error` gate that currently guards the whole page:

```jsx
const [tokens, setTokens] = useState([]);
const [tokensLoading, setTokensLoading] = useState(true);
const [tokensError, setTokensError] = useState(false);

const tokensController = useMemo(
  () => new StaffUserRecoveryTokensController(setTokens, setTokensLoading, setTokensError),
  [],
);

useEffect(() => {
  if (loading || error || !user) return undefined;
  return tokensController.buildEffect(user.id)();
}, [tokensController, loading, error, user]);

// ...
return StaffUserHelper.render(user, { tokens, tokensLoading, tokensError });
```

(The token fetch only needs `user.id`, which is only known once the user itself has loaded — hence gating the effect on `loading`/`error`/`user`, not adding a second top-level loading gate.)

**`StaffUserHelper.render`** — thread the new `tokensState` object through to `#renderRecoveryTokenPanel`:

```js
static render(user, tokensState) {
  return (
    <div className="container mt-4">
      <BackButton href="#/staff/users" />
      <h1>{Translator.t('staff_user_page.title')}</h1>
      {StaffUserHelper.#renderDetails(user)}
      {StaffUserHelper.#renderRecoveryTokenPanel(tokensState)}
      {StaffUserHelper.#renderEditAction(user)}
    </div>
  );
}
```

**`#renderRecoveryTokenPanel`** — loading / error / empty / table, in that precedence:

```js
static #renderRecoveryTokenPanel({ tokens, tokensLoading, tokensError }) {
  return (
    <div className="mt-4">
      <h2>{Translator.t('staff_user_page.recovery_tokens_title')}</h2>
      {tokensLoading && <LoadingMessage message={Translator.t('staff_user_page.recovery_tokens_loading')} />}
      {!tokensLoading && tokensError && <ErrorAlert error={Translator.t('staff_user_page.recovery_tokens_error')} />}
      {!tokensLoading && !tokensError && tokens.length === 0 && (
        <p>{Translator.t('staff_user_page.recovery_tokens_empty')}</p>
      )}
      {!tokensLoading && !tokensError && tokens.length > 0 && StaffUserHelper.#renderTokenTable(tokens)}
    </div>
  );
}

static #renderTokenTable(tokens) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>{Translator.t('staff_user_page.recovery_token_status_column')}</th>
          <th>{Translator.t('staff_user_page.recovery_token_created_column')}</th>
          <th>{Translator.t('staff_user_page.recovery_token_expires_column')}</th>
          <th>{Translator.t('staff_user_page.recovery_token_preview_column')}</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((token) => {
          const badge = RecoveryTokenStatusBadges.build(token);
          return (
            <tr key={token.id}>
              <td><Badge variant={badge.variant} text={badge.text} /></td>
              <td>{token.created_at}</td>
              <td>{token.expires_at}</td>
              <td>{token.token_preview}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
```

Exact column set/formatting (e.g. locale date formatting, whether `used_at`/`invalidated_at` get their own columns vs. only surface via the status badge) is an implementation judgment call for whoever writes the code — the issue only requires status, `created_at`, `expires_at`, `used_at`/`invalidated_at`, and the masked preview to be visible somewhere in the row.

## Files to Change

- `frontend/assets/js/components/resources/staff_user/pages/StaffUser.jsx` — add token state + second controller/effect, pass `tokensState` into `StaffUserHelper.render`.
- `frontend/assets/js/components/resources/staff_user/pages/helpers/StaffUserHelper.jsx` — implement `#renderRecoveryTokenPanel` and `#renderTokenTable`; update `render`'s JSDoc param list.
