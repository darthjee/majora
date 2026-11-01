# `seed_dev_domains` management command

Create `backend/domains/management/commands/seed_dev_domains.py` (with the `management/` and
`commands/` `__init__.py` files). Keep the logic in a small, testable service class (e.g.
`domains/seeds/dev_domains_seeder.py`) and make the command a thin wrapper.

Behaviour:

1. **Guard.** If `os.environ.get('SEED_DEV_DOMAINS') != 'true'` or
   `os.environ.get('STAGE') == 'production'`, print a skipped notice naming the reason and
   return. Nothing is written.
2. **Hosts.** `DEV_HOSTS = ('localhost', '127.0.0.1')`.
3. **Resolve the target group.** If a `Domain` row for `localhost` exists, use its
   `domain_group`. Otherwise use `DomainGroup.objects.get_or_create(name='Local development')`.
4. **Create the missing hosts.** For each host with no `Domain` row, create one with
   `schemes='http'` in the target group (`full_clean()` first). If the row already exists, leave
   it completely untouched (no scheme or group change). Catch `IntegrityError` on create (a
   concurrent seed): re-read the row and treat it as existing.
5. **Attach games.** For each seeded host's group (the distinct `domain_group` of every row in
   `DEV_HOSTS`, after step 4), add every `Game` not already in it, through
   `game.game_domain_groups` / the group's reverse relation. Use one bulk `add(*games)` per
   group, which is a no-op for games already linked.
6. **Output.** One line per created host, skipped host and group that gained games (with a
   count). A second run prints only "already present" lines and writes nothing.

Run steps 3–5 inside `transaction.atomic()`, with the `IntegrityError` handled through a nested
savepoint around each create.

## Files to Change

- `backend/domains/management/__init__.py`, `backend/domains/management/commands/__init__.py`:
  new.
- `backend/domains/management/commands/seed_dev_domains.py`: new command.
- `backend/domains/seeds/__init__.py`, `backend/domains/seeds/dev_domains_seeder.py`: new
  service (or a similar location that follows existing service conventions).
- `backend/domains/tests/management/commands/seed_dev_domains_test.py` (+ `__init__.py` files):
  - empty DB → both hosts are created under "Local development" with `schemes='http'`;
  - every game is attached;
  - a second run changes nothing;
  - an existing `localhost` in another group is kept, its group gets the games, and
    `127.0.0.1` is created in that group;
  - with `localhost` and `127.0.0.1` in different groups, both groups get every game;
  - existing rows keep their `schemes`;
  - nothing happens without `SEED_DEV_DOMAINS=true`, or with `STAGE=production`;
  - an `IntegrityError` on create is handled (mock `Domain.objects.create` to raise once after
    inserting the row).
