# Translator Plan: Access statistics: Overview tab (KPI tiles)

Main plan: [plan.md](plan.md)

## Shared contracts

Produce the `staff_statistics_page.overview.*` keys listed in
[plan.md — i18n keys](plan.md#i18n-keys-translator-produces-frontend-consumes), with the
exact key names and `{{count}}` / `{{share}}` placeholders. The frontend formats numbers before
interpolation, so translations only place the placeholder.

## Implementation Steps

### Step 1 — Add the `overview` block in both languages

Add an `overview:` block under `staff_statistics_page` (after `visits:`) in the English file
with the texts from the contract, and the Portuguese equivalents in the `pt` file (e.g.
`Visitas`, `Visitantes únicos`, `Usuários logados`, `Duração média da visita`,
`Novos vs recorrentes`, `Novos: {{count}}`, `Recorrentes: {{count}}`,
`{{share}} recorrentes`, a note saying "novo" means the first visit recorded,
`Carregando visão geral...`, `Não foi possível carregar a visão geral.`). Keep both files'
key sets identical so `check_i18n` passes. No existing key changes: `placeholder` stays,
because the other tabs still use it.

## Files to Change

- `frontend/assets/i18n/en/staff_statistics_page.yaml`: add the `overview` block.
- `frontend/assets/i18n/pt/staff_statistics_page.yaml`: add the `overview` block (Portuguese).

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)
