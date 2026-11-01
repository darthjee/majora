# Translator Plan: Dev stack: local frontend at localhost:3000 renders a blank page

Main plan: [plan.md](plan.md)

## Shared contracts

Keys the frontend reads with `Translator.t`, in both `en` and `pt`:

- `error_boundary.title`: en "Something went wrong"
- `error_boundary.message`: en "An unexpected error occurred while rendering this page."
- `error_boundary.reload`: en "Reload page"
- `games_page.domain_not_recognized`: en "This domain is not configured, so no games can be
  listed."

## Implementation Steps

### Step 1 — Add the en/pt translations

Create `frontend/assets/i18n/en/error_boundary.yaml` and `frontend/assets/i18n/pt/error_boundary.yaml`
(top-level key `error_boundary:`), and add `domain_not_recognized` to both `games_page.yaml`
files. Portuguese suggestions: "Algo deu errado", "Ocorreu um erro inesperado ao exibir esta
página.", "Recarregar página", "Este domínio não está configurado, então nenhum jogo pode ser
listado." If new files must be registered somewhere (an index/loader), register them, then run
the translation-key sync check script.

## Files to Change

- `frontend/assets/i18n/en/error_boundary.yaml`, `frontend/assets/i18n/pt/error_boundary.yaml`:
  new.
- `frontend/assets/i18n/en/games_page.yaml`, `frontend/assets/i18n/pt/games_page.yaml`: new key.
