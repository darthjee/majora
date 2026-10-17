# Token generation

Add creation logic (for example a `ApiToken.objects.create_token(owner, name, scopes, games=None,
expires_at=None)` manager method, or a module-level helper in `api_token.py`) that returns
`(api_token, plain_token)`:

- Alphabet `string.ascii_letters + string.digits` (base62); draw with
  `''.join(secrets.choice(ALPHABET) for _ in range(n))`, never `secrets.token_urlsafe`.
- Prefix 8 chars, secret 43 chars, independent of each other.
- Store `hashlib.sha256(secret.encode()).hexdigest()` and the prefix; never store the plain secret.
- Plain token is `f'mjr_{prefix}_{secret}'` (56 chars), returned once to the caller.
- Retry up to 3 times when saving raises `IntegrityError` on the unique prefix (wrap each attempt in
  `transaction.atomic()`); re-raise after the last attempt.
- Keep a small shared helper for hashing the secret so the authentication class uses the same one.

Tests: format matches `^mjr_[A-Za-z0-9]{8}_[A-Za-z0-9]{43}$`; stored hash equals SHA-256 of the
secret part and the plain token is not stored anywhere on the row; a mocked prefix clash is
retried and succeeds; three clashes re-raise; games are attached when given.

## Files to Change

- `backend/accounts/models/api_token.py` — generation and hash helper.
- `backend/accounts/tests/models/api_token_test.py` — generation tests.
