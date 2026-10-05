# Translator Plan: Access statistics: Users tab (ranking table)

Main plan: [plan.md](plan.md)

## Shared contracts

Add the `users.*` keys listed in [plan.md](plan.md#i18n-keys) under `staff_statistics_page`,
in both languages.

## Implementation Steps

### Step 1 — Add the Users tab keys

Add a `users:` block to `staff_statistics_page` in en and pt, after the `domains:` block,
holding every key of the shared contract. Keep the en and pt key sets identical. Write the
Portuguese translations (e.g. `Usuários`, `Visitas`, `Tempo no site`, `Duração média`,
`Acessos`, `Domínios`, `Visto por último`, `desconhecido`, `Perfil`, `Ordenado decrescente`,
`Nenhum usuário logado neste período.`, `Não foi possível carregar os usuários.`), following
the wording already used by the `domains` / `duration` blocks for the same concepts.

## Files to Change

- `frontend/assets/i18n/en/staff_statistics_page.yaml` — new `users:` block.
- `frontend/assets/i18n/pt/staff_statistics_page.yaml` — same keys, in Portuguese.

## CI Checks

- `frontend`: `docker-compose run --rm frontend yarn check_i18n` (en/pt key parity).

## Notes

- Check whether `staff_statistics_page.tabs.users` already exists; it does not need to change.
